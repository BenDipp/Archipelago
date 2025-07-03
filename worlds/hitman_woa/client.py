import asyncio

import threading
import time
import requests

from CommonClient import ClientCommandProcessor, get_base_parser, handle_url_arg, server_loop, gui_enabled, logger, CommonContext
from NetUtils import ClientStatus, NetworkItem
from settings import get_settings
from .items import item_table, base_id

class HitmanCommandProcessor(ClientCommandProcessor):
    def __init__(self, ctx: CommonContext):
        super().__init__(ctx)

class HitmanContext(CommonContext):
    command_processor = HitmanCommandProcessor
    game = "HITMAN World of Assasination"
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
        try:
            r = requests.get(self.peacock_url)
            if r.status_code != 200:
                raise Exception(r.text)
        except Exception as e:
            logger.error("No respone from Peacock, please make sure the Peacock server is running before connecting.")
            self.exit_event.set()
            return

        if password_requested and not self.password:
            await super(HitmanContext, self).server_auth(password_requested)
        await self.get_username()
        await self.send_connect(game=self.game) 

    def on_package(self, cmd: str, args: dict):
        match cmd:
            case "Connected":
                self.game = self.slot_info[self.slot].game
                self.slot_data = args["slot_data"]
                self.set_difficulty()
                self.set_goal()
                self.sse_thread = threading.Thread(name="SSE-Thread",target=self.periodically_get_checks, daemon=True)
                self.sse_thread.start() 
            case "ReceivedItems":
                self.recieve_items(args["items"])
            case "PrintJSON"| "Retrieved" |  "Bounced" | "RoomUpdate" | "SetReply" | "DataPackage":
                pass
            case "RoomInfo":
                self.current_seed = args["seed_name"]
            case _:
                print("Not implemented cmd: "+cmd+", with args: "+str(args))

    async def disconnect(self, allow_autoreconnect: bool = False):
        if self.sse_thread != None:
            self.sse_running = False

        self.collected_contract_pieces = 0
        self.current_seed = None
        self.slot_data = None
        await super().disconnect(allow_autoreconnect)

    async def disconnectOnWindowClose(self):
        # only nececery in rare circumstances, where the window would give no respone when closing with the windows x while connected
        await self.disconnect()

    def make_gui(self):
        ui = super().make_gui()
        ui.base_title = "Archipelago HITMAN Client"
        return ui

    def set_difficulty(self):
        try:
            r = requests.get(self.peacock_url+"/setDifficulty/"+self.slot_data["difficulty"]+"/"+str(self.current_seed))
            r.raise_for_status()
        except Exception as e:
                logger.error("Error occured while attempting to set difficulty, disconnecting!")
                self.disconnect(False)

    def set_goal(self):
        try:
            match self.slot_data["goal_mode"]:
                case "level_completion":
                    goalData = self.slot_data["goal_location_name"]
                    moreGoalData = self.slot_data["goal_rating"]
                case "contract_collection":
                    goalData = self.slot_data["goal_amount"]
                    moreGoalData = "none"

            r = requests.get(self.peacock_url+"/setGoal/"+self.slot_data["goal_mode"]+"/"+str(goalData)+"/"+moreGoalData)
            r.raise_for_status()
        except Exception as e:
                logger.error("Error occured while attempting to set goal, disconnecting!")
                self.disconnect(False)

    def recieve_items(self, items:list[NetworkItem]):
        itemIds = []
        for item in items:
            itemIds.append(item.item)
            if item.item == base_id + item_table["Contract Piece"][0]:
                self.collected_contract_pieces += 1
        try:
            r = requests.post(self.peacock_url+"/sendItems?items="+str(itemIds)) 
            r.raise_for_status()
        except Exception as e:
                logger.error("No response when sending Items to Peacock, disconnecting!")
                asyncio.run(self.disconnect(False))
                return

        if self.slot_data["goal_mode"] == "contract_collection" and self.collected_contract_pieces >= self.slot_data["goal_amount"]:
            loop = asyncio.get_event_loop()
            loop.create_task(self.send_msgs([{"cmd": "StatusUpdate", "status": ClientStatus.CLIENT_GOAL}]))

    def periodically_get_checks(self):
        self.sse_running = True
        while self.sse_running:
            try:
                response = requests.get(f"{self.peacock_url}/checks")

                response.raise_for_status()  # Raises on 4xx and 5xx codes
                checks = response.json()
                asyncio.run(self.check_locations(checks))

                if self.slot_data["goal_mode"] == "level_completion" and self.slot_data["goal_location_id"] in checks:
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
