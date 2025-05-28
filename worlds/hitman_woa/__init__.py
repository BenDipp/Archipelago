from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Dict, List
from BaseClasses import Item, ItemClassification, Region, Tutorial
from Fill import FillError
from worlds.generic.Rules import set_rule
from worlds.AutoWorld import WebWorld, World
from worlds.LauncherComponents import Component, Type, components, launch as launch_component, icon_paths
from .settings import HitmanSettings
from .items import HitmanItem, item_table, base_id
from .options import HitmanOptions
from .locations import HitmanLocation, location_table, goal_table

class HitmanWeb(WebWorld):
    theme = "partyTime"
    tutorials = [Tutorial(
        "Multiworld Setup Guide",
        "A guide to setting up the Hitman Archipelago Multiworld",
        "English",
        "setup_en.md",
        "setup/en",
        ["BenDipp"])]

def launch_client():
    from .client import launch
    launch_component(launch, name="HitmanClient",)


components.append(Component("HITMAN World of Assasination Client", "HitmanClient", func=launch_client, component_type=Type.CLIENT,icon=__name__))
icon_paths[__name__] = f"ap:{__name__}/assets/icon.png"

class HitmanWorld(World):
    """
    Hitman: World of Assassination is a stealth action game developed by IO Interactive.
    Play as Agent 47, a genetically engineered assassin, and travel the globe to eliminate high-profile targets with creativity and precision.
    """

    game = "HITMAN World of Assasination"
    web = HitmanWeb()
    settings: HitmanSettings
    options_dataclass = HitmanOptions
    options: HitmanOptions
    topology_present = True
    ut_can_gen_without_yaml = True

    location_name_to_id = {name: data[0] + base_id for name, data in location_table.items()}
    item_name_to_id = {name: data[0] + base_id for name, data in item_table.items()}

    #Keep as list with playerId to differentiate enttilements from multiple players using same world
    enabled_entitlements:Dict[int,List] = {}

    # Universal Tracker support:
    @staticmethod
    def interpret_slot_data(slot_data: Dict[str, Any]) -> Dict[str, Any]:
        return slot_data
    ut_can_gen_without_yaml = True

    def generate_early(self):
        self.enabled_entitlements[self.player] = []
        self.enabled_entitlements[self.player].append("free")

        # Universal Tracker support:
        if hasattr(self.multiworld, "generation_is_fake"):
            if hasattr(self.multiworld, "re_gen_passthrough"):
                if self.game in self.multiworld.re_gen_passthrough:
                    slot_data = self.multiworld.re_gen_passthrough[self.game]
                    self.options.enable_itemsanity.value = slot_data["enable_itemsanity"]
                    self.options.include_s1_locations.value = slot_data["include_s1_locations"]
                    self.options.include_s2_locations.value = slot_data["include_s2_locations"]
                    self.options.include_s2_dlc_locations.value = slot_data["include_s2_dlc_locations"]
                    self.options.include_s3_locations.value = slot_data["include_s3_locations" ]
                    self.options.check_for_completion.value = slot_data["check_for_completion"]
                    self.options.check_for_sa.value = slot_data["check_for_sa"]
                    self.options.check_for_so.value = slot_data["check_for_so"]
                    self.options.check_for_saso.value = slot_data["check_for_saso"]
                    self.options.starting_location.value = slot_data["starting_location"]
                    self.options.goal_level.value = slot_data["goal_level"]
        
        # make sure the goal Level is added as location
        if self.options.goal_mode.value == self.options.goal_mode.option_level_completion:
            self.enabled_entitlements[self.player].append(self.options.goal_level.current_key)
            match self.options.goal_rating.value:
                case self.options.goal_rating.option_any:
                                self.enabled_entitlements[self.player].append(self.options.goal_level.current_key+"_completed")
                                self.goal_location = goal_table[self.options.goal_level.current_key] + " Completed"
                case self.options.goal_rating.option_silent_assassin:
                                self.enabled_entitlements[self.player].append(self.options.goal_level.current_key+"_sa")
                                self.goal_location = goal_table[self.options.goal_level.current_key] + " Completed - Silent Assassin"
                case self.options.goal_rating.option_suit_only:
                                self.enabled_entitlements[self.player].append(self.options.goal_level.current_key+"_so")
                                self.goal_location = goal_table[self.options.goal_level.current_key] + " Completed - Suit Only"
                case self.options.goal_rating.option_silent_assassin_suit_only:
                                self.enabled_entitlements[self.player].append(self.options.goal_level.current_key+"_saso")
                                self.goal_location = goal_table[self.options.goal_level.current_key] + " Completed - Silent Assassin, Suit Only"

        # make sure the start Level is added as location
        self.enabled_entitlements[self.player].append(self.options.starting_location.current_key)

        self.enabled_entitlements[self.player].append("ica_facility")

        # save enables map entitlements to array
        if self.options.include_s1_locations:
            #self.enabled_entitlements[self.player].append("h1")
            self.enabled_entitlements[self.player].append("paris")
            self.enabled_entitlements[self.player].append("sapienza")
            self.enabled_entitlements[self.player].append("marrakesh")
            self.enabled_entitlements[self.player].append("bangkok")
            self.enabled_entitlements[self.player].append("colorado")
            self.enabled_entitlements[self.player].append("hokkaido")

        if self.options.include_s2_locations:
            #self.enabled_entitlements[self.player].append("h2")
            self.enabled_entitlements[self.player].append("hawkes_bay")
            self.enabled_entitlements[self.player].append("miami")
            self.enabled_entitlements[self.player].append("santa_fortuna")
            self.enabled_entitlements[self.player].append("mumbai")
            self.enabled_entitlements[self.player].append("whittleton_creek")
            self.enabled_entitlements[self.player].append("isle_of_sgail")

        if self.options.include_s2_dlc_locations:
            #self.enabled_entitlements[self.player].append("h2_dlc")
            self.enabled_entitlements[self.player].append("new_york")
            self.enabled_entitlements[self.player].append("haven_island")

        if self.options.include_s3_locations:
            #self.enabled_entitlements[self.player].append("h3")
            self.enabled_entitlements[self.player].append("dubai")
            self.enabled_entitlements[self.player].append("dartmoor")
            self.enabled_entitlements[self.player].append("berlin")
            self.enabled_entitlements[self.player].append("chongqing")
            self.enabled_entitlements[self.player].append("mendoza")
            self.enabled_entitlements[self.player].append("carpathian_mountains")
            self.enabled_entitlements[self.player].append("ambrose_island")

        # enable completion checks
        if self.options.check_for_completion:
            self.enabled_entitlements[self.player].append("completed")

        if self.options.check_for_sa:
            self.enabled_entitlements[self.player].append("sa")

        if self.options.check_for_so:
            self.enabled_entitlements[self.player].append("so")

        if self.options.check_for_saso:
            self.enabled_entitlements[self.player].append("saso")

        if self.options.enable_itemsanity:
            self.enabled_entitlements[self.player].append("itemsanity")

        #TODO are you REALLY sure everyone with H3 has them? But H2 definetly not always
        self.enabled_entitlements[self.player].append("H1_GOTY_UNLOCKABLES")
        self.enabled_entitlements[self.player].append("LEGACY")
        self.enabled_entitlements[self.player].append("H1_GOTY_UNLOCKABLES,LEGACY")

        # Check for H3 editions
        if self.options.include_deluxe_items:
            self.enabled_entitlements[self.player].append("DELUXE")

        if self.options.include_h2_expansion_items:
            self.enabled_entitlements[self.player].append("H2_RACCOON_STINGRAY") 

        if self.options.include_sins_items:
            self.enabled_entitlements[self.player].append("SINS")

        # Check for Elusive Target DLCs
        if self.options.include_splitter_items:
            self.enabled_entitlements[self.player].append("H3_ET_LAMBIC")

        if self.options.include_disruptor_items:
            self.enabled_entitlements[self.player].append("H3_ET_PENICILLIN")

        if self.options.include_undying_items:
            self.enabled_entitlements[self.player].append("H3_ET_SAMBUCA")

        if self.options.include_drop_items:
            self.enabled_entitlements[self.player].append("H3_ET_TOMORROWLAND")

        # Check for H3 DLC
        if self.options.include_trinity_items:
            self.enabled_entitlements[self.player].append("TRINITY")

        if self.options.include_street_art_items:
            self.enabled_entitlements[self.player].append("H3_VANITY_CONCRETEART")

        if self.options.include_makeshift_items:
            self.enabled_entitlements[self.player].append("H3_VANITY_MAKESHIFTSCRAP")
        
        # Check for H2 DLC
        if self.options.include_executive_items:
            self.enabled_entitlements[self.player].append("EXECUTIVE")
            self.enabled_entitlements[self.player].append("COLLECTORS_OR_EXECUTIVE")

        if self.options.include_collectors_items:
            self.enabled_entitlements[self.player].append("COLLECTORS")
            self.enabled_entitlements[self.player].append("COLLECTORS_OR_EXECUTIVE")


        if self.options.include_smart_casual_items:
            self.enabled_entitlements[self.player].append("SMART_CASUAL") 
            if self.options.include_h2_expansion_items:
                self.enabled_entitlements[self.player].append("SMART_CASUAL,H2_RACCOON_STINGRAY") 


        if self.options.include_winter_sports_items:
            self.enabled_entitlements[self.player].append("WINTER_SPORTS") 
        

    def create_regions(self) -> None:
        menu_region = Region("Menu", self.player, self.multiworld)
        self.multiworld.regions.append(menu_region)

        map_region = Region("Non Menu Region", self.player, self.multiworld)
        self.multiworld.regions.append(map_region)
        menu_region.connect(map_region)

        for location in location_table:
            location_entitlements_fulfilled = len(location_table[location][1]) == 0 or any(x in location_table[location][1] for x in self.enabled_entitlements[self.player]) 
            settings_entitlements_fulfilled = len(location_table[location][2]) == 0 or any(x in location_table[location][2] for x in self.enabled_entitlements[self.player])
    
            if location_entitlements_fulfilled and settings_entitlements_fulfilled:
                map_region.add_locations({location :self.location_name_to_id[location]},HitmanLocation)
                set_rule(self.multiworld.get_location(location, self.player),
                         lambda state, loop_location = location: state.has_from_list(location_table[loop_location][3],self.player,1))

    def create_item(self, item:str) -> HitmanItem:
        return HitmanItem(item,item_table[item][2],item_table[item][0]+base_id,self.player)

    def create_event(self, event: str) -> HitmanItem:
        return HitmanItem(event, ItemClassification.progression, None, self.player)
      
    def create_items(self) -> None:
        item_pool : List[Item] = []

        valid_filler = []
        valid_useful = []
        starting_locaiton = "Level - "+goal_table[self.options.starting_location.current_key]

        for item in item_table:
            if item_table[item][1] == "" or item_table[item][1] in self.enabled_entitlements[self.player]:
                if item_table[item][2] == ItemClassification.progression and item != starting_locaiton:
                    item_pool.append(self.create_item(item))
                if item_table[item][2] == ItemClassification.filler:
                    valid_filler.append(item)
                if item_table[item][2] == ItemClassification.useful:
                    valid_useful.append(item)

        if self.options.goal_mode.value == self.options.goal_mode.option_contract_collection:
            contract_count = int((Decimal(100 + self.options.goal_additional_contract_pieces_percent)/100 * self.options.goal_required_contract_pieces).to_integral_value(rounding=ROUND_HALF_UP)) # Yoinked from OoT Triforce Hunt
            for i in range(1, contract_count):
                item_pool.append(self.create_item("Contract Piece"))

        total_locations = len(self.multiworld.get_unfilled_locations(self.player))
        total_items = len(item_pool)
        
        for _ in range(total_locations - total_items):
            if len(valid_useful) != 0:
                choosenItem = self.random.choice(valid_useful)
                item_pool.append(self.create_item(choosenItem))
                valid_useful.remove(choosenItem)
            elif len(valid_filler) != 0:
                choosenItem = self.random.choice(valid_filler)
                item_pool.append(self.create_item(choosenItem))
                valid_filler.remove(choosenItem)
            else:
                raise FillError("Not enough items to fill locations")
            # TODO: add new filler item incase more locations then even all available fillers
        
        self.multiworld.push_precollected(self.create_item(starting_locaiton))
        self.multiworld.itempool.extend(item_pool)

    def set_rules(self) -> None:

        match self.options.goal_mode.value:
            #case self.options.goal_mode.option_number_of_completions:
            #    self.multiworld.completion_condition[self.player] = lambda state: state.has_from_list_unique(
            #        [item for item in item_table if 
            #            (item_table[item][2]==ItemClassification.progression and 
            #             item_table[item][1] in self.enabled_entitlements[self.player])
            #        ],
            #        self.player,
            #        self.options.goal_amount.value) 
                #Assumes that every level-unlock gives 1 check towards the goal
            case self.options.goal_mode.option_level_completion:
                self.multiworld.completion_condition[self.player] = lambda state: state.can_reach_location(self.goal_location, self.player)
            case self.options.goal_mode.option_contract_collection:
                self.multiworld.completion_condition[self.player] = lambda state: state.has("Contract Piece", self.player, self.options.goal_required_contract_pieces.value) 
    
    def fill_slot_data(self):
        slotdata = self.options.as_dict( # copy options for yaml-less Universal Tracker
            "enable_itemsanity", 
            "include_s1_locations", "include_s2_locations", "include_s2_dlc_locations", "include_s3_locations", 
            "check_for_completion", "check_for_sa", "check_for_so", "check_for_saso",
            "starting_location", "goal_level"
        )

        match self.options.game_difficulty.value:
            case self.options.game_difficulty.option_casual:
                slotdata["difficulty"] = "easy"
            case self.options.game_difficulty.option_professional:
                slotdata["difficulty"] = "normal"
            case self.options.game_difficulty.option_master:
                slotdata["difficulty"] = "hard"
        
        slotdata["goal_mode"] = self.options.goal_mode.current_key
        match self.options.goal_mode.value:
            #case self.options.goal_mode.option_number_of_completions: #TODO not working yet
            #    slotdata["goal_amount"] = self.options.goal_amount.value
            #    slotdata["goal_rating"] = self.options.goal_rating.current_key
            case self.options.goal_mode.option_level_completion:
                slotdata["goal_location_id"] = self.location_name_to_id[self.goal_location]
                slotdata["goal_location_name"] = self.options.goal_level.current_key
                slotdata["goal_rating"] = self.options.goal_rating.current_key
            case self.options.goal_mode.option_contract_collection:
                slotdata["goal_amount"] = self.options.goal_required_contract_pieces.value

        return slotdata