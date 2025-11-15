from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Dict, List
from BaseClasses import Item, ItemClassification, Region, Tutorial
from Fill import FillError
from Options import OptionError
from worlds.generic.Rules import set_rule
from worlds.AutoWorld import WebWorld, World
from worlds.LauncherComponents import Component, Type, components, launch as launch_component, icon_paths
from .settings import HitmanSettings
from .items import HitmanItem, item_table, base_id
from .options import HitmanOptions
from .locations import HitmanLocation, location_table, goal_table, target_table_ranges, vanilla_target_table, game_changers_table

class HitmanWeb(WebWorld):
    theme = "partyTime"
    tutorials = [Tutorial(
        "Multiworld Setup Guide",
        "A guide to setting up the Hitman Archipelago Multiworld",
        "English",
        "setup_en.md",
        "setup/en",
        ["BenDipp"])]
    option_groups = options.option_groups

def launch_client(*args):
    from .client import launch
    launch_component(launch, name="HitmanClient", args=args)


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

    def build_name_groups(item_list, index):
        name_groups = {}
        for name, data in item_list.items():
            groups = data[index] 
            if not groups:  # skip if empty
                continue
            for group in groups:
                name_groups.setdefault(group, set()).add(name)
        return name_groups

    location_name_groups = build_name_groups(location_table, 6)
    item_name_groups = build_name_groups(item_table, 4)
    
    # Universal Tracker support:
    @staticmethod
    def interpret_slot_data(slot_data: Dict[str, Any]) -> Dict[str, Any]:
        return slot_data
    ut_can_gen_without_yaml = True

    def generate_early(self):
        if self.options.random_targets.value and self.options.min_number_of_targets.value > self.options.max_number_of_targets.value:
            print("WARNING "+self.player_name+": Minimum number of targets cannot exceed Maximum number of targets, Swapping values to avoid generation Failure.")
            min = self.options.min_number_of_targets.value
            self.options.min_number_of_targets.value = self.options.max_number_of_targets.value
            self.options.max_number_of_targets.value = min

        if self.options.random_complications.value and self.options.min_number_of_complications.value > self.options.max_number_of_complications.value:
            print("WARNING "+self.player_name+": Minimum number of complications cannot exceed Maximum number of complications, Swapping values to avoid generation Failure.")
            min = self.options.min_number_of_complications.value
            self.options.min_number_of_complications.value = self.options.max_number_of_complications.value
            self.options.max_number_of_complications.value = min

        if self.options.random_complications and sum(self.options.complications_weights.value[x] != 0 for x in self.options.complications_weights.value) < self.options.max_number_of_complications:
            raise OptionError("Not enough non-zero Complications for selected number of Complications.")

        if self.options.goal_mode.value == self.options.goal_mode.option_contract_collection_level_completion and\
        self.options.goal_level.value == self.options.starting_location.value:
            raise OptionError("Goal Level cannot be the same as Starting Level with \"Contract Collection-Level Completion\" Goal Mode.")

        if any(x.startswith("Level - ") for x in self.options.excluded_items.value):
            raise OptionError("Cannot exclude Level-Items. If you want to exclude a Level, use the \"included_x_locations\" options.")

        self.enabled_entitlements[self.player] = []

        # Universal Tracker support:
        if hasattr(self.multiworld, "generation_is_fake"):
            if hasattr(self.multiworld, "re_gen_passthrough"):
                if self.game in self.multiworld.re_gen_passthrough:
                    slot_data = self.multiworld.re_gen_passthrough[self.game]
                    self.options.enable_itemsanity.value = slot_data["enable_itemsanity"]
                    self.options.split_itemsanity.value = slot_data["split_itemsanity"]
                    self.options.included_s1_locations.value = slot_data["included_s1_locations"]
                    self.options.included_s2_locations.value = slot_data["included_s2_locations"]
                    self.options.included_s2_dlc_locations.value = slot_data["included_s2_dlc_locations"]
                    self.options.included_s3_locations.value = slot_data["included_s3_locations" ]
                    self.options.levels_with_check_for_completion.value = slot_data["levels_with_check_for_completion"]
                    self.options.levels_with_check_for_sa.value = slot_data["levels_with_check_for_sa"]
                    self.options.levels_with_check_for_so.value = slot_data["levels_with_check_for_so"]
                    self.options.levels_with_check_for_saso.value = slot_data["levels_with_check_for_saso"]
                    self.options.starting_location.value = slot_data["starting_location"]
                    self.options.goal_level.value = slot_data["goal_level"]
                    self.options.random_targets.value = slot_data["random_targets"]
                    self.options.min_number_of_targets.value = slot_data["min_number_of_targets"]
                    self.options.max_number_of_targets.value = slot_data[ "max_number_of_targets"]
                    self.options.enable_target_checks.value = slot_data["enable_target_checks"]
                    self.options.enable_disguisesanity.value = slot_data["enable_disguisesanity"]

        
        # make sure the goal Level is added as location
        if self.options.goal_mode.value == self.options.goal_mode.option_level_completion or \
        self.options.goal_mode.value == self.options.goal_mode.option_contract_collection_level_completion:
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

        self.enabled_entitlements[self.player].extend(self.options.included_s1_locations.value)
        self.enabled_entitlements[self.player].extend(self.options.included_s2_locations.value)
        self.enabled_entitlements[self.player].extend(self.options.included_s2_dlc_locations.value)
        self.enabled_entitlements[self.player].extend(self.options.included_s3_locations.value)

        # enable completion checks
        if "all" in self.options.levels_with_check_for_completion.value:
            self.enabled_entitlements[self.player].append("completed")
        else:
            for location in self.options.levels_with_check_for_completion.value:
                self.enabled_entitlements[self.player].append(location+"_completed")

        if "all" in self.options.levels_with_check_for_sa.value:
            self.enabled_entitlements[self.player].append("sa")
        else:
            for location in self.options.levels_with_check_for_sa.value:
                self.enabled_entitlements[self.player].append(location+"_sa")

        if "all" in self.options.levels_with_check_for_so.value:
            self.enabled_entitlements[self.player].append("so")
        else:
            for location in self.options.levels_with_check_for_so.value:
                self.enabled_entitlements[self.player].append(location+"_so")

        if "all" in self.options.levels_with_check_for_saso.value:
            self.enabled_entitlements[self.player].append("saso")
        else:
            for location in self.options.levels_with_check_for_saso.value:
                self.enabled_entitlements[self.player].append(location+"_saso")

        if self.options.enable_itemsanity:
            if self.options.split_itemsanity:
                self.enabled_entitlements[self.player].append("split_itemsanity")
            else:
                self.enabled_entitlements[self.player].append("itemsanity")
        
        if self.options.enable_disguisesanity:
            self.enabled_entitlements[self.player].append("disguisesanity")

        self.enabled_entitlements[self.player].append("H3_SIGNITURE_PACK")#Swtich 2 Pre-order Items
        self.enabled_entitlements[self.player].append("H3_QUACK_PACK")#Switch 2 Physical Pre-order Items
        self.enabled_entitlements[self.player].append("LOCATION_GOLDEN") #Freelancer Items

        #TODO: Currently Assume Player is on H3, so always give theese
        self.enabled_entitlements[self.player].append("H1_GOTY")
        self.enabled_entitlements[self.player].append("H2_LEGACY")
        self.enabled_entitlements[self.player].append("H1_REQUIEM_PACK")


        # Check for H3 editions
        if self.options.include_deluxe_items:
            self.enabled_entitlements[self.player].append("H3_DELUXE_PACK")

        if self.options.include_h2_expansion_items:
            self.enabled_entitlements[self.player].append("H2_GREEDY") 
            self.enabled_entitlements[self.player].append("H2_STINGRAY") 

        if self.options.include_sins_items: #TODO: options for individual enable
            self.enabled_entitlements[self.player].append("H3_SINS_GREED")
            self.enabled_entitlements[self.player].append("H3_SINS_PRIDE")
            self.enabled_entitlements[self.player].append("H3_SINS_SLOTH")
            self.enabled_entitlements[self.player].append("H3_SINS_LUST")
            self.enabled_entitlements[self.player].append("H3_SINS_GLUTTONY")
            self.enabled_entitlements[self.player].append("H3_SINS_ENVY")
            self.enabled_entitlements[self.player].append("H3_SINS_WRATH")

        # Check for Elusive Target DLCs
        if self.options.include_splitter_items:
            self.enabled_entitlements[self.player].append("H3_ET_LAMBIC")

        if self.options.include_disruptor_items:
            self.enabled_entitlements[self.player].append("H3_ET_PENICILLIN")

        if self.options.include_undying_items:
            self.enabled_entitlements[self.player].append("H3_ET_SAMBUCA")

        if self.options.include_drop_items:
            self.enabled_entitlements[self.player].append("H3_ET_TOMORROWLAND")

        if self.options.include_banker_items:
            self.enabled_entitlements[self.player].append("H3_ET_FRENCHMARTINI")

        if self.options.include_bruce_lee_items:
            self.enabled_entitlements[self.player].append("H3_ET_BAIJU")

        # Check for H3 DLC
        if self.options.include_trinity_items:
            self.enabled_entitlements[self.player].append("H3_TRINITY")

        if self.options.include_street_art_items:
            self.enabled_entitlements[self.player].append("H3_VANITY_CONCRETEART")

        if self.options.include_makeshift_items:
            self.enabled_entitlements[self.player].append("H3_VANITY_MAKESHIFTSCRAP")

        # Check for H2 DLC
        if self.options.include_executive_items:
            self.enabled_entitlements[self.player].append("H2_EXECUTIVE")
            self.enabled_entitlements[self.player].append("H2_COLLECTORS_OR_EXECUTIVE")

        if self.options.include_collectors_items:
            self.enabled_entitlements[self.player].append("H2_COLLECTORS")
            self.enabled_entitlements[self.player].append("H2_COLLECTORS_OR_EXECUTIVE")

        if self.options.include_smart_casual_items:
            self.enabled_entitlements[self.player].append("H2_SMART_CASUAL") 

        if self.options.include_winter_sports_items:
            self.enabled_entitlements[self.player].append("H2_WINTER_SPORTS") 

    def create_regions(self) -> None:
        menu_region = Region("Menu", self.player, self.multiworld)
        self.multiworld.regions.append(menu_region)

        map_region = Region("Non Menu Region", self.player, self.multiworld)
        self.multiworld.regions.append(map_region)
        menu_region.connect(map_region)

        for location in location_table:

            #if game is not in master-difficulty, some items appear in additional levels
            if self.options.game_difficulty.value != self.options.game_difficulty.option_master: 
                entitlement_appendex =  location_table[location][4]
            else:
                entitlement_appendex = []
            
            location_entitlements_fulfilled = any(x in (location_table[location][1] + entitlement_appendex) for x in self.enabled_entitlements[self.player])

            settings_entitlements_fulfilled = len(location_table[location][2]) == 0 or any(x in location_table[location][2] for x in self.enabled_entitlements[self.player])
    
            if location_entitlements_fulfilled and settings_entitlements_fulfilled:

                if self.options.game_difficulty.value != self.options.game_difficulty.option_master: 
                    required_item_appendex = location_table[location][5]
                else:
                    required_item_appendex = []

                all_required_items = location_table[location][3]+required_item_appendex # resolve late binding of "location" inside the following lambda by making copy

                map_region.add_locations({location :self.location_name_to_id[location]},HitmanLocation)
                set_rule(self.multiworld.get_location(location, self.player),
                        lambda state, required_items = all_required_items: state.has_from_list(required_items,self.player,1))
            
        if self.options.goal_mode.value == self.options.goal_mode.option_contract_collection or \
        self.options.goal_mode.value == self.options.goal_mode.option_contract_collection_level_completion:
            map_region.add_locations({location :self.location_name_to_id["All Contract Pieces Collected"]},HitmanLocation)
            set_rule(self.multiworld.get_location("All Contract Pieces Collected", self.player),
                        lambda state, required_items = "Contract Piece": state.has(required_items,self.player,self.options.goal_required_contract_pieces.value))
            
        if self.options.random_targets.value:
            target_slot_data = ""
            already_used_targets = []
            for map in target_table_ranges:
                if map in self.enabled_entitlements[self.player]:
                    num_of_targets = self.random.randint(self.options.min_number_of_targets.value,self.options.max_number_of_targets)
                    for i in range(0, num_of_targets):
                        if(target_table_ranges[map][1]-target_table_ranges[map][0]+1 <= len(already_used_targets)):
                            break
                        chosen_target = self.random.randint(target_table_ranges[map][0],target_table_ranges[map][1])
                        while chosen_target in already_used_targets:
                            chosen_target = self.random.randint(target_table_ranges[map][0],target_table_ranges[map][1])
                        target_slot_data += str(chosen_target)+"_"
                        already_used_targets.append(chosen_target)

                        if self.options.enable_target_checks.value:
                            location = self.location_id_to_name[chosen_target+base_id]
                            map_region.add_locations({location: chosen_target+base_id},HitmanLocation)

                            set_rule(self.multiworld.get_location(location, self.player),
                                lambda state, required_items = location_table[location][3]: state.has_from_list(required_items,self.player,1))

                target_slot_data+="-"
                already_used_targets = []

            self.target_slotdata = target_slot_data
        else:
            if self.options.enable_target_checks.value:            
                for map in vanilla_target_table:
                    if  map in self.enabled_entitlements[self.player]:
                        for i in vanilla_target_table[map]:
                            location = self.location_id_to_name[i+base_id]
                            map_region.add_locations({location: i+base_id}, HitmanLocation)

                            set_rule(self.multiworld.get_location(location, self.player),
                            lambda state, required_items = location_table[location][3]: state.has_from_list(required_items,self.player,1))

            self.target_slotdata = "vanilla"

        enabled_levels_count = sum(entitlement in goal_table.keys() for entitlement in set(self.enabled_entitlements[self.player]))
        contract_piece_count = self.options.goal_required_contract_pieces.value + self.options.goal_additional_contract_pieces.value

        progression_item_count = enabled_levels_count + (contract_piece_count if self.options.goal_mode.value == self.options.goal_mode.option_contract_collection or self.options.goal_mode.value ==self.options.goal_mode.option_contract_collection_level_completion else 0)

        if progression_item_count-1 > len(self.multiworld.get_locations(self.player)): 
            raise OptionError("Not enough locations for progression items. Consider adding more locations or remove some Contract Pieces.")

    def create_item(self, item:str) -> HitmanItem:
        return HitmanItem(item,item_table[item][2],item_table[item][0]+base_id,self.player)

    def create_event(self, event: str) -> HitmanItem:
        return HitmanItem(event, ItemClassification.progression, None, self.player)
      
    def create_items(self) -> None:
        item_pool : List[Item] = []

        valid_filler = []
        valid_useful = []
        valid_duplicats = []
        starting_locaiton = "Level - "+goal_table[self.options.starting_location.current_key]

        for item in item_table:
            if len(item_table[item][1]) == 0 or all(x in self.enabled_entitlements[self.player] for x in item_table[item][1]):
                if item in self.options.excluded_starting_items.value:
                    self.multiworld.push_precollected(self.create_item(item))
                    continue
                if item in self.options.excluded_items.value:
                    continue
                if item_table[item][2] == ItemClassification.progression and item != starting_locaiton and item != "Contract Piece":
                    item_pool.append(self.create_item(item))
                if item_table[item][2] == ItemClassification.filler:
                    valid_filler.append(item)
                if item_table[item][2] == ItemClassification.useful:
                    valid_useful.append(item)
                if item_table[item][3]: #is allowed to be duplicated
                     valid_duplicats.append(item)

        second_sphere_item = self.random.choice(item_pool).name
        self.multiworld.early_items[self.player][second_sphere_item] = 1

        if self.options.goal_mode.value == self.options.goal_mode.option_contract_collection or \
        self.options.goal_mode.value == self.options.goal_mode.option_contract_collection_level_completion:
            for i in range(0, self.options.goal_required_contract_pieces.value+self.options.goal_additional_contract_pieces.value):
                item_pool.append(self.create_item("Contract Piece"))

        if self.options.goal_mode.value == self.options.goal_mode.option_contract_collection_level_completion:
            item_pool.remove(self.create_item("Level - "+goal_table[self.options.goal_level.current_key]))
            self.multiworld.get_location("All Contract Pieces Collected", self.player).place_locked_item(self.create_item("Level - "+goal_table[self.options.goal_level.current_key]))

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
                choosenItem = self.random.choice(valid_duplicats)
                item_pool.append(self.create_item(choosenItem))
        
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
            case self.options.goal_mode.option_level_completion | self.options.goal_mode.option_contract_collection_level_completion:
                self.multiworld.completion_condition[self.player] = lambda state: state.can_reach_location(self.goal_location, self.player)
            case self.options.goal_mode.option_contract_collection:
                self.multiworld.completion_condition[self.player] = lambda state: state.can_reach_location("All Contract Pieces Collected", self.player)
    
    def fill_slot_data(self):
        slotdata = self.options.as_dict( # copy options for yaml-less Universal Tracker
            "enable_itemsanity", "split_itemsanity", "enable_disguisesanity",
            "included_s1_locations", "included_s2_locations", "included_s2_dlc_locations", "included_s3_locations", 
            "levels_with_check_for_completion", "levels_with_check_for_sa", "levels_with_check_for_so", "levels_with_check_for_saso",
            "starting_location", "goal_level",
            "random_targets", "min_number_of_targets", "max_number_of_targets", "enable_target_checks"
        )
        slotdata["starting_location_name"] = self.options.starting_location.current_key

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
                slotdata["goal_location_id"] = self.location_name_to_id["All Contract Pieces Collected"]
            case self.options.goal_mode.option_contract_collection_level_completion:
                slotdata["goal_location_id"] = self.location_name_to_id[self.goal_location]
                slotdata["goal_location_name"] = self.options.goal_level.current_key
                slotdata["goal_rating"] = self.options.goal_rating.current_key
                slotdata["goal_amount"] = self.options.goal_required_contract_pieces.value

        slotdata["targets"] = self.target_slotdata

        if self.options.random_complications.value:
            complication_slot_data = ""
            complication_weights = self.options.complications_weights.value

            for map in goal_table:
                if map in self.enabled_entitlements[self.player] and map != "carpathian_mountains":
                    num_of_complications = self.random.randint(self.options.min_number_of_complications.value,self.options.max_number_of_complications)

                    alread_used_complications = []
                    for _ in range(0, num_of_complications):
                        chosen_complications = self.random.choice(
                            [x for x, w in complication_weights.items() 
                             for _ in range(w) 
                             if w != 0 and x not in alread_used_complications]
                            )
                        
                        alread_used_complications.append(chosen_complications)
                    
                        complication_slot_data += str(game_changers_table[chosen_complications])+"_"

                complication_slot_data+="-"
            slotdata["complications"] = complication_slot_data
        else:
            slotdata["complications"] = "vanilla"

        slotdata["everything_item"] = self.options.enable_flamingo_photo.value == 1

        return slotdata