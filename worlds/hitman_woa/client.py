import asyncio

import threading
import time
import requests

from CommonClient import ClientCommandProcessor, get_base_parser, handle_url_arg, server_loop, gui_enabled, logger, CommonContext
from NetUtils import ClientStatus, NetworkItem
from settings import get_settings
from .items import item_table, base_id
from .locations import goal_table

class HitmanCommandProcessor(ClientCommandProcessor):
    def __init__(self, ctx: CommonContext):
        super().__init__(ctx)

class HitmanContext(CommonContext):
    command_processor = HitmanCommandProcessor
    game = "HITMAN World of Assassination"
    tags = {"AP"}
    items_handling = 0b111
    want_slot_data = True
    slot_data = {}
    collected_contract_pieces = 0
    sse_thread = None
    sse_running = False
    peacock_url = "http://"+get_settings().hitman_woa_options.peacock_url+ "/_wf/archipelago"
    current_seed = None

    async def server_auth(self, password_requested: bool = False):
        # check if Peacock is running
        logger.info("Testing connection to Peacock...")
        try:
            r = requests.get(self.peacock_url)
            r.raise_for_status()
        except Exception as e:
            logger.error("No respone from Peacock, please make sure the Peacock server is running before connecting.")
            self.exit_event.set()
            return
        logger.info("Peacock connection established.")            

        if password_requested and not self.password:
            await super(HitmanContext, self).server_auth(password_requested)
        await self.get_username()
        await self.send_connect(game=self.game) 

    def on_package(self, cmd: str, args: dict):
        match cmd:
            case "Connected":
                self.collected_contract_pieces = 0
                self.slot_data = None

                self.game = self.slot_info[self.slot].game
                self.slot_data = args["slot_data"]
                self.set_slot_data()
                self.set_goal()
                self.process_checked_locations(args["checked_locations"])
                self.sse_thread = threading.Thread(name="SSE-Thread",target=self.periodically_get_checks, daemon=True)
                self.sse_thread.start() 
            case "ReceivedItems":
                self.process_recieved_items(args["items"])
            case "RoomUpdate":
                self.process_checked_locations(args.get("checked_locations",[]))
            case "PrintJSON"| "Retrieved" |  "Bounced" | "SetReply" | "DataPackage":
                pass
            case "RoomInfo":
                self.current_seed = args["seed_name"]
            case _:
                print("Not implemented cmd: "+cmd+", with args: "+str(args))

    async def disconnect(self, allow_autoreconnect: bool = False):
        if self.sse_thread != None:
            self.sse_running = False

        await super().disconnect(allow_autoreconnect)

    async def disconnectOnWindowClose(self):
        # only nececery in rare circumstances, where the window would give no respone when closing with the windows x while connected
        await self.disconnect()

    def make_gui(self):
        ui = super().make_gui()
        ui.base_title = "Archipelago HITMAN Client"
        return ui

    def set_slot_data(self):
        logger.info("Sending Slot Data to Peacock...")
        try:
            enabled_levels = self.slot_data["included_s1_locations"]+\
            self.slot_data["included_s2_locations"]+\
            self.slot_data["included_s2_dlc_locations"]+\
            self.slot_data["included_s3_locations"]+\
            [self.slot_data["starting_location"]]

            if(self.slot_data["goal_mode"] == "level_completion" or\
               self.slot_data["goal_mode"] == "contract_collection_level_completion"):
                enabled_levels.append(self.slot_data["goal_location_name"])

            enabled_string = ""
            completion_string = ""

            for location in goal_table.keys():
                if location in enabled_levels:
                    enabled_string += "t-"

                    if location in self.slot_data["levels_with_check_for_completion"] or\
                    "all" in self.slot_data["levels_with_check_for_completion"]:
                        completion_string+="completed_"
            
                    if location in self.slot_data["levels_with_check_for_sa"] or\
                    "all" in self.slot_data["levels_with_check_for_sa"]:
                        completion_string+="sa_"

                    if location in self.slot_data["levels_with_check_for_so"] or\
                    "all" in self.slot_data["levels_with_check_for_so"]:
                        completion_string+="so_" 

                    if location in self.slot_data["levels_with_check_for_saso"] or\
                    "all" in self.slot_data["levels_with_check_for_saso"]:
                        completion_string+="saso_"

                    completion_string+="-"
                else:
                    enabled_string += "-"
                    completion_string += "-"

            itemsanity_string = "off"
            if self.slot_data["enable_itemsanity"]:
                if self.slot_data["split_itemsanity"]:
                    itemsanity_string = "split"
                else:
                    itemsanity_string = "combined"

            r = requests.get(
                self.peacock_url+"/setData/"+
                self.slot_data["difficulty"]+"/"+
                str(self.current_seed)+"/"+
                enabled_string+"/"+
                completion_string+"/"+
                self.slot_data.get("targets","vanilla")+"/"+
                str(self.slot_data.get("enable_target_checks",0)==1)+"/"+
                self.slot_data.get("complications","vanilla")+"/"+
                itemsanity_string+"/"+
                str(self.slot_data.get("enable_disguisesanity",0)==1)+"/"+
                str(self.slot_data.get("everything_item",False)))
            r.raise_for_status()
            logger.info("Slot Data sent.")
        except Exception as e:
                logger.error("Error occured while attempting to set slot data, disconnecting!")
                print("Error sending slot data:", e)
                asyncio.run_coroutine_threadsafe(self.disconnect(False), asyncio.get_running_loop())

    def set_goal(self):
        try:
            match self.slot_data["goal_mode"]:
                case "level_completion":
                    goalData = self.slot_data["goal_location_name"]
                    moreGoalData = self.slot_data["goal_rating"]
                    evenMoreGoalData = "none"
                case "contract_collection":
                    goalData = self.slot_data["goal_amount"]
                    moreGoalData = "none"
                    evenMoreGoalData = "none"
                case "contract_collection_level_completion":
                    goalData = self.slot_data["goal_amount"]
                    moreGoalData = self.slot_data["goal_location_name"]
                    evenMoreGoalData = self.slot_data["goal_rating"]

            logger.info("Sending Goal information...")
            r = requests.get(self.peacock_url+"/setGoal/"+self.slot_data["goal_mode"]+"/"+str(goalData)+"/"+moreGoalData+"/"+evenMoreGoalData)
            r.raise_for_status()
            logger.info("Goal information sent.")
        except Exception as e:
                logger.error("Error occured while attempting to set goal, disconnecting!")
                print("Error sending goal info:", e)
                asyncio.run_coroutine_threadsafe(self.disconnect(False), asyncio.get_running_loop())

    def process_recieved_items(self, items:list[NetworkItem]):
        itemIds = []
        for item in items:
            itemIds.append(item.item - base_id)
            if item.item == base_id + item_table["Contract Piece"][0]:
                self.collected_contract_pieces += 1

            if len(itemIds) > 500:
                self.send_items(itemIds)
                itemIds = []
        
        self.send_items(itemIds)
          
    def send_items(self, itemIds:list[int]):
        try:
            r = requests.post(self.peacock_url+"/sendItems?items="+str(itemIds)) 
            r.raise_for_status()
        except Exception as e:
            logger.error("No response when sending Items to Peacock, disconnecting!")
            asyncio.run_coroutine_threadsafe(self.disconnect(False), asyncio.get_running_loop())
 
    def process_checked_locations(self, locations:list[int]):
        locationIds = []
        for locationId in locations:
            locationIds.append(locationId-base_id)

            if len(locationIds) > 500:
                self.send_checked_locations(locationIds)
                locationIds = []
        
        self.send_checked_locations(locationIds)

    def send_checked_locations(self, locationIds:list[int]):
        try:
            r = requests.post(self.peacock_url+"/sendCheckedLocations?items="+str(locationIds)) 
            r.raise_for_status()
        except Exception as e:
            logger.error("No response when sending checked Locations to Peacock, disconnecting!")
            asyncio.run_coroutine_threadsafe(self.disconnect(False), asyncio.get_running_loop())

    def periodically_get_checks(self):
        self.sse_running = True
        while self.sse_running:
            try:
                response = requests.get(f"{self.peacock_url}/checks")

                response.raise_for_status()  # Raises on 4xx and 5xx codes
                checks = response.json()
                asyncio.run(self.check_locations(checks))

                if (self.slot_data["goal_mode"] == "level_completion" or self.slot_data["goal_mode"] == "contract_collection_level_completion" or self.slot_data["goal_mode"] == "contract_collection") and self.slot_data["goal_location_id"] in checks:
                    asyncio.run(self.send_msgs([{"cmd": "StatusUpdate", "status": ClientStatus.CLIENT_GOAL}]))
            except requests.RequestException as e:
                print("Error fetching checks:", e)
                logger.error("Error while trying to get Checks, disconnecting")
                asyncio.run(self.disconnect(False))
                self.sse_running = False
            if self.sse_running:
                time.sleep(3)

async def main(args):
    ctx = HitmanContext(args.connect, args.password)
    ctx.auth = args.name

    import atexit
    atexit.register(ctx.disconnectOnWindowClose)

    ctx.server_task = asyncio.create_task(server_loop(ctx), name="server loop")

    if gui_enabled:
        ctx.run_gui()
    ctx.run_cli()

    await ctx.exit_event.wait()
    await ctx.shutdown()

def launch(*args):
    import colorama

    parser = get_base_parser(description="HITMAN Archipelago Client, for interfacing with a Peacock server.")
    parser.add_argument('--name', default=None, help="Slot Name to connect as.")
    parser.add_argument("url", nargs="?", help="Archipelago connection url")
    args = parser.parse_args(args)

    args = handle_url_arg(args, parser=parser)

    # use colorama to display colored text highlighting on windows
    colorama.init()

    asyncio.run(main(args))
    colorama.deinit()
