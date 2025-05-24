import asyncio

import threading
import time
import requests

from CommonClient import ClientCommandProcessor, get_base_parser, handle_url_arg, server_loop, gui_enabled, logger
from NetUtils import ClientStatus, Endpoint, NetworkItem

tracker_lodaded  = False
#try:
#    from worlds.tracker.TrackerClient import TrackerGameContext as SuperContext
#    tracker_lodaded = True
#except ModuleNotFoundError:
from CommonClient import CommonContext as SuperContext

class HitmanCommandProcessor(ClientCommandProcessor):
    def __init__(self, ctx: SuperContext):
        super().__init__(ctx)

class HitmanContext(SuperContext):
    command_processor = HitmanCommandProcessor
    game = "HITMAN World of Assasination"
    tags = {"AP"}
    items_handling = 0b111  # receive all items for /received TODO: wtf does that mean
    want_slot_data = True
    slot_data = {}
    collected_contract_pieces = 0
    sse_thread = None
    sse_running = False
    peacock_url = "http://localhost/_wf/archipelago"

    async def server_auth(self, password_requested: bool = False):
        # check if Peacock is running
        try:
            r = requests.get(self.peacock_url)
            if r.status_code != 200:
                raise Exception(r.text)
        except Exception as e:
            logger.error("No respone from Peacock, are you sure it is running?")# TODO: better errors
            self.exit_event.set()
            return

        if password_requested and not self.password:
            await super(HitmanContext, self).server_auth(password_requested)
        await self.get_username()
        await self.send_connect(game="HITMAN World of Assasination") #TODO: why cant acess game or self.game?

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
            case "PrintJSON"| "Retrieved" | "RoomInfo" | "Bounced" | "RoomUpdate":
                pass #not implemented
            case _:
                print("Not implemented cmd: "+cmd+", with args: "+str(args))

    async def disconnect(self, allow_autoreconnect: bool = False):
        self.game = ""

        if self.sse_thread != None:
            self.sse_running = False

        await super().disconnect(allow_autoreconnect)

    async def disconnectOnWindowClose(self):
        # only nececery in rare circumstances where it would give no respone when closing with windos x while connected
        await self.disconnect()

    def make_gui(self):
        ui = super().make_gui()
        ui.base_title = "Archipelago HITMAN Client"
        return ui

    def set_difficulty(self):
        try:
            r = requests.get(self.peacock_url+"/setDifficulty/"+self.slot_data["difficulty"])
            if not r.status_code == 200:
                logger.error("No response when setting difficulty, disconnecting!")
                self.disconnect(False)
        except Exception as e:
                logger.error("No response when setting difficulty, disconnecting!")
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
            if not r.status_code == 200:
                logger.error("No response when setting goal, disconnecting!")
                self.disconnect(False)
        except Exception as e:
                logger.error("No response when setting goal, disconnecting!")
                self.disconnect(False)

    def recieve_items(self, items:list[NetworkItem]):
        itemIds = []
        for item in items:
            itemIds.append(item.item)
            if item.item - 2023011800 == 1000: #TODO: dont hardcode baseid or contract piece
                self.collected_contract_pieces += 1
        try:
            r = requests.post(self.peacock_url+"/sendItems?items="+str(itemIds)) 
            #TODO: somehow configure this? (but assume localhost isnt too bad) also port? (I think P uses 80 always?)
            if not r.status_code == 200:
                logger.error("No response when sending Items, disconnecting!")
                asyncio.run(self.disconnect(False))
                return
        except Exception as e:
                logger.error("No response when sending Items, disconnecting!")
                asyncio.run(self.disconnect(False))
                return

        if self.slot_data["goal_mode"] == "contract_collection" and self.collected_contract_pieces >= self.slot_data["goal_amount"]:
            print("SENDING GOAL!")
            loop = asyncio.get_event_loop()
            loop.create_task(self.send_msgs([{"cmd": "StatusUpdate", "status": ClientStatus.CLIENT_GOAL}]))

    def periodically_get_checks(self):
        self.sse_running = True
        while self.sse_running:
            try:
                response = requests.get(f"{self.peacock_url}/checks")
                response.raise_for_status()  # Raise an error for bad responses (4xx, 5xx)
                checks = response.json()
                asyncio.run(self.check_locations(checks))
                if self.slot_data["goal_mode"] == "level_completion" and self.slot_data["goal_location_id"] in checks:
                    asyncio.run(self.send_msgs([{"cmd": "StatusUpdate", "status": ClientStatus.CLIENT_GOAL}]))
            except requests.RequestException as e:
                print("Error fetching checks:", e)
                logger.error("Error while trying to get Checks, disconnecting")
                asyncio.run(self.disconnect(False))
                self.sse_running = False
            if not self.sse_running:
                time.sleep(10) #TODO: this is definetly not beeing respected, idk why 

            
    """
    def recieve_sse(self):
        while True:
            print("connecting to SSE")
            try:
                with requests.get(self.peacock_url+"/sse", stream=True, timeout=6) as response:
                    for line in response.iter_lines():
                        if line:
                            line_str = line.decode("utf-8")
                            locationId: int = int(line_str)
                            asyncio.run(self.check_locations({locationId}))

            except Exception as e:
                print("SSE: "+e)
                self.disconnect(False)
    """
async def main(args):
    ctx = HitmanContext(args.connect, args.password)
    ctx.auth = args.name

    import atexit
    atexit.register(ctx.disconnectOnWindowClose)

    #if not ctx.exit_event.is_set:
    ctx.server_task = asyncio.create_task(server_loop(ctx), name="server loop")

    if tracker_lodaded:
        ctx.run_generator()
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
