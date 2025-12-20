from dataclasses import dataclass

from schema import Schema
from Options import Choice, ItemSet, OptionCounter, OptionGroup, OptionSet, PerGameCommonOptions, Range, Toggle, Visibility, DefaultOnToggle
from .locations import game_changers_table

class Goal(Choice):
    """The goal condition for your Archipelago run.
    -level_completion: requires beating a specific level with a specific rating 
    -contract_collection: shuffles a number of \"Contract Piece\" items into the item pool and requires the collection of them to instantly goal
    -contract_collection_level_completion: requires beating a specific level with a specific rating, after collecting a certain number of Contract Pieces from the item pool to unlock that level
    -number_of_completions: forces Contract Pieces to only be placed on beating each level with a specific rating and requires the collection of a number of them to instantly goal """
    display_name = "Goal"
    option_level_completion = 2
    option_contract_collection = 3
    option_contract_collection_level_completion = 4
    option_number_of_completions = 5
    default = 2
    
class GoalDifficulty(Choice):
    """When goal is set to contract_collection_level_completion or level_completion, which rating the goal level needs to be completed with to win.
    When goal is set to number_of_completions, which rating each level needs to be completed with to gain a Contract Piece."""
    display_name = "Goal Level Rating"
    option_any = 1
    option_silent_assassin = 2
    option_suit_only = 3
    option_silent_assassin_suit_only = 4
    default = 1

class GoalLevel(Choice):
    """When goal is set to level_completion or contract_collection_level_completion, which level is the goal. If the selected level is not included in the "included_x_locations" options, it will be added to it."""
    display_name = "Goal Level"
    option_ica_facility = 0
    option_paris = 1
    option_sapienza = 2
    option_marrakesh = 3
    option_bangkok = 4
    option_colorado = 5
    option_hokkaido = 6
    option_hawkes_bay = 7
    option_miami = 8
    option_santa_fortuna = 9
    option_mumbai = 10 
    option_whittleton_creek = 11
    option_isle_of_sgail = 12
    option_new_york = 13
    option_haven_island = 14
    option_dubai = 15
    option_dartmoor = 16
    option_berlin = 17
    option_chongqing = 18
    option_mendoza = 19
    option_carpathian_mountains = 20
    option_ambrose_island = 21
    default = 20

class GoalAmount(Range):
   """When the goal is set to number_of_completions, how many levels must be beaten with the selected rating to award the goal."""
   display_name = "Goal Amount"
   range_end = 22
   range_start = 1
   default = 5

class RequiredContractPieceAmount(Range):
    """When the goal is set to contract_collection or contract_collection_level_completion, how many contract pieces are shuffled into the item pool and are required to be collected to award the goal."""
    display_name = "Required Contract Pieces"
    range_end = 100
    range_start = 1
    default = 5

class AdditionalContractPieces(Range):
    """When the goal is set to contract_colleciton or contract_collection_level_completion, how many additional contract pieces are added in the item pool."""
    display_name = "Number of Additional Contract Pieces"
    range_end = 100
    range_start = 0
    default = 5

class StartingLevel(Choice):
    """Which level is unlocked from the start. If the selected level is not included in the "included_x_locations"options, it will be added to it."""
    display_name = "Starting Level"
    option_ica_facility = 0 
    option_paris = 1
    option_sapienza = 2
    option_marrakesh = 3
    option_bangkok = 4
    option_colorado = 5
    option_hokkaido = 6
    option_hawkes_bay = 7
    option_miami = 8
    option_santa_fortuna = 9
    option_mumbai = 10 
    option_whittleton_creek = 11
    option_isle_of_sgail = 12
    option_new_york = 13
    option_haven_island = 14
    option_dubai = 15
    option_dartmoor = 16
    option_berlin = 17
    option_chongqing = 18
    option_mendoza = 19
    option_carpathian_mountains = 20
    option_ambrose_island = 21
    default = 0

class IncludedH1Levels(OptionSet):
    """
    Include Locations from the following Hitman 1 Levels in the Location Pool
    valid options: ica_facility, paris, sapienza, marrakesh, bangkok, colorado, hokkaido
    """
    display_name = "Included Hitman 1 Levels"
    valid_keys = ["ica_facility", "paris", "sapienza", "marrakesh", "bangkok", "colorado", "hokkaido"]
    default = ["ica_facility", "paris", "sapienza", "marrakesh", "bangkok", "colorado", "hokkaido"]

class IncludedH2Levels(OptionSet):
    """
    Include Locations from the following Hitman 2 Levels in the Location Pool
    valid options: hawkes_bay, miami, santa_fortuna, mumbai, whittleton_creek, isle_of_sgail
    """
    display_name = "Included Hitman 2 Levels"
    valid_keys = ["hawkes_bay", "miami", "santa_fortuna", "mumbai", "whittleton_creek", "isle_of_sgail"]
    default = ["hawkes_bay", "miami", "santa_fortuna", "mumbai", "whittleton_creek", "isle_of_sgail"]

class IncludedH2DLCLevels(OptionSet):
    """
    Include Locations from the following Hitman 2 Expansion Levels in the Location Pool
    valid options: new_york, haven_island
    """
    display_name = "Included Hitman 2 DLC Levels"
    valid_keys = ["new_york", "haven_island"]
    default = []

class IncludedH3Levels(OptionSet):
    """
    Include Locations from the following Hitman 3 Levels in the Location Pool
    valid options: dubai, dartmoor, berlin, chongqing, mendoza, carpathian_mountains, ambrose_island
    """
    display_name = "Included Hitman 3 Levels"
    valid_keys = ["dubai", "dartmoor", "berlin", "chongqing", "mendoza", "carpathian_mountains", "ambrose_island"]
    default = ["dubai", "dartmoor", "berlin", "chongqing", "mendoza", "carpathian_mountains", "ambrose_island"]

class CheckForCompletion(OptionSet):
    """Add a check for beating each of the listed levels, regardless of Rating
    valid options: all, ica_facility, paris, sapienza, marrakesh, bangkok, colorado, hokkaido, hawkes_bay, miami, santa_fortuna, mumbai, whittleton_creek, isle_of_sgail, new_york, haven_island, dubai, dartmoor, berlin, chongqing, mendoza, carpathian_mountains, ambrose_island"""
    display_name = "Levels with completion checks"
    valid_keys = ["all", "ica_facility", "paris", "sapienza", "marrakesh", "bangkok", "colorado", "hokkaido", "hawkes_bay", "miami", "santa_fortuna", "mumbai", "whittleton_creek", "isle_of_sgail", "new_york", "haven_island", "dubai", "dartmoor", "berlin", "chongqing", "mendoza", "carpathian_mountains", "ambrose_island"]
    default = ["all"]

class CheckForSA(OptionSet):
    """Add a check for beating each of the listed levels with a Silent Assassin Rating
    valid options: all, ica_facility, paris, sapienza, marrakesh, bangkok, colorado, hokkaido, hawkes_bay, miami, santa_fortuna, mumbai, whittleton_creek, isle_of_sgail, new_york, haven_island, dubai, dartmoor, berlin, chongqing, mendoza, carpathian_mountains, ambrose_island"""
    display_name = "Levels with Silent Assassin checks"
    valid_keys = ["all", "ica_facility", "paris", "sapienza", "marrakesh", "bangkok", "colorado", "hokkaido", "hawkes_bay", "miami", "santa_fortuna", "mumbai", "whittleton_creek", "isle_of_sgail", "new_york", "haven_island", "dubai", "dartmoor", "berlin", "chongqing", "mendoza", "carpathian_mountains", "ambrose_island"]

class CheckForSO(OptionSet):
    """Add a check for beating each of the listed levels without using disguises
    valid options: all, ica_facility, paris, sapienza, marrakesh, bangkok, colorado, hokkaido, hawkes_bay, miami, santa_fortuna, mumbai, whittleton_creek, isle_of_sgail, new_york, haven_island, dubai, dartmoor, berlin, chongqing, mendoza, carpathian_mountains, ambrose_island"""
    display_name = "Levels with Suit Only checks"
    valid_keys = ["all", "ica_facility", "paris", "sapienza", "marrakesh", "bangkok", "colorado", "hokkaido", "hawkes_bay", "miami", "santa_fortuna", "mumbai", "whittleton_creek", "isle_of_sgail", "new_york", "haven_island", "dubai", "dartmoor", "berlin", "chongqing", "mendoza", "carpathian_mountains", "ambrose_island"]

class CheckForSASO(OptionSet):
    """Add a check for beating each of the listed levels with Silent Assassin Rating without using disguises
    valid options: all, ica_facility, paris, sapienza, marrakesh, bangkok, colorado, hokkaido, hawkes_bay, miami, santa_fortuna, mumbai, whittleton_creek, isle_of_sgail, new_york, haven_island, dubai, dartmoor, berlin, chongqing, mendoza, carpathian_mountains, ambrose_island"""
    display_name = "Levels with Silent Assassin, Suit Only checks"
    valid_keys = ["all", "ica_facility", "paris", "sapienza", "marrakesh", "bangkok", "colorado", "hokkaido", "hawkes_bay", "miami", "santa_fortuna", "mumbai", "whittleton_creek", "isle_of_sgail", "new_york", "haven_island", "dubai", "dartmoor", "berlin", "chongqing", "mendoza", "carpathian_mountains", "ambrose_island"]

class CheckForTarget(DefaultOnToggle):
    """Add a check for each Target to be eliminated"""
    display_name = "Enable Target Checks"

class Itemsanity(Toggle):
    """Add a check for each unique item that can be picked up"""
    display_name = "Enable Itemsanity"

class DisguiseSanity(Toggle):
    """Add a check for each unique disguise that can be found in each level"""
    display_name = "Enable Disguisesanity"

class SplitItemsanity(Toggle):
    """Split the checks from itemsanity by map (\"Itempickup - Crowbar\" becomes \"Itempickup - ICA Facility - Crowbar\", \"Itempickup - Paris - Crowbar\", \"Itempickup - Sapienza - Crowbar\" etc.)"""
    display_name = "Split Itemsanity"

class GameDifficulty(Choice):
    """Set the ingame difficulty for all missions:
    - Casual: Unlimited saves, All Mission Story guides available, No surveillance cameras, Less enforcers, Forgiving combat, More items are legal to carry, NPCs are less attentive to sounds.
    - Professional: Unlimited saves, All Mission Story guides available, Surveillance cameras active, Cameras alert guards if illegal activity is spotted, Combat is challenging but fair.
    - Master: One save per mission, No Mission Story guides available, Extra surveillance cameras, Extra enforcers, Ruthless and demanding combat, Bloody eliminations ruin disguises, NPCs are more attentive to sounds.
    """
    display_name = "Game Difficulaty"
    option_casual = 0
    option_professional = 1
    option_master = 2
    default = 1

class RandomTargets(Toggle):
    """Should random Targets be assigned to each Level. For each level, a random number of targets between min_number_of_targets and max_number_of_targets is choosen. If off, the vanilla targets will be chosen (Note: Carpathian Mountains will always remain vanilla.)"""
    display_name = "Random Targets"

class MaxRandomTargets(Range):
    """The maximum number of Targets to be assigned to a Level if Random Targets is active""" 
    display_name = "Max Number of Random Targets"
    range_end = 5
    range_start = 1
    default = 2

class MinRandomTargets(Range):
    """The minimum number of Targets to be assigned to a Level if Random Targets is active""" 
    display_name = "Min Number of Random Targets"
    range_end = 5
    range_start = 1
    default = 2

class RandomComplications(Toggle):
    """Should random Complications be assigend to each Level. For each level, a random number of complications between min_number_of_complications and max_number_of_complications is chosen (Note: Carpathian Mountains will always remain vanilla.)"""
    display_name = "Random Complications"

class MaxComplications(Range):
    """The maximum number of Complications to be assigned to a Level if Random Complications is active""" 
    display_name = "Max Number of Complications"
    range_end = 5
    range_start = 1
    default = 2

class MinComplications(Range):
    """The minimum number of Complications to be assigned to a Level if Random Complications is active""" 
    display_name = "Min Number of Complications"
    range_end = 5
    range_start = 1
    default = 1

class ComplicationWeights(OptionCounter):
    """When Random Complications is active, these weights determine the odds for each complication to be selected.
    If you don't want a specific complication, set its weight to 0."""
    display_name = "Complication Weights"
    min = 0
    default = {
        "No Agility": 1,
        "No Disguises": 1,
        #"All Bodies Hidden": 1,
        "Do Not get Spotted": 1,
        "No Non-Target Civilian Kills or Pacifications": 1,
        "Target Only": 1,
        "5 min Timer": 0,
        #"Hide all Bodies within 90 sec": 0,
        "No Surveillance Recordings": 1,
        "No Bodies Found": 1,
        "Headshots Only": 1,
        "Perfect Shooter": 0,
        "One Disguise Change": 1,
        "One Pacification": 1,
        "If Recorded by Camera, finish in 2 min": 0,
        "No Civilian Casualties": 0,
        "No Balistic Kills": 0,
        "3 min Timer": 0,
        "No Pacifications": 1,
        "Defuse Combat Situations": 0,
        "Accident Kills Only": 0,
        "No Lethal Poison Kills": 1,
    }
    valid_keys = game_changers_table

class EnableEverythingItem(Choice):
    """Adds multiple Item Packages one for each type of item (Pistol, Poison, Explosive etc.). When starting a mission with a package equipped, all unlocked and concealable items will be added to 47's pocket. 
    
    The \"in_inventory\" option adds the packages directly to your starting inventory, the \"in_itempool\" options adds the packages to the itempool and shuffles them to to any check in the multiworld."""
    display_name = "Enable Item Packages"
    option_off = 0
    option_in_inventory = 1
    option_in_itempool = 2
    default = 0

class ExcludedItems(ItemSet):
    """List of Items to not be shuffled the multiworld. 
    Selected Items cannot be obtained ingame. 
    Also accepts Itemgroups (ex.: \"Agency Pickup - Any\", \"Starting Location - Any\")"""
    display_name = "Excluded Items"

class ExcludedStartingItems(ItemSet):
    """List of Items to not be shuffled into the multiworld. 
    Selected Items will always be unlocked ingame. 
    Also accepts Itemgroups (ex.: \"Agency Pickup - Any\", \"Starting Location - Any\")"""
    display_name = "Excluded Starting Items"

class IncludeDeluxeItems(Toggle):
    """Include Items from the HITMAN 3 Deluxe Pack"""
    display_name = "Include Deluxe Pack Items"

class IncludeGOTYItems(DefaultOnToggle):
    """Include Items from the HITMAN 1 Game of the Year Update"""
    display_name = "Include GOTY Items"
    visibility = Visibility.none #TODO: should be in H3 always, I think, but unsure

class IncludeExpansionItems(Toggle):
    """Include Items from the HITMAN 2 Expansion Pack"""
    display_name = "Include Expansion Pass Items"

class IncludeSinsItems(Toggle):
    """Include Items from the HITMAN 3 Seven Deadly Sins Collection"""
    display_name = "Include Seven Deadly Sins Collection Items"

class IncludeLambicItems(Toggle):
    """Include Items from the Splitter Pack"""
    display_name = "Include Splitter Pack Items"

class IncludePenecillinItems(Toggle):
    """Include Items from the Disruptor Pack"""
    display_name = "Include Disruptor Pack Items"

class IncludeSambucaItems(Toggle):
    """Include Items from the Undying Pack"""
    display_name = "Include Undying Pack Items"

class IncludeTomorrowlandItems(Toggle):
    """Include Items from the Drop Pack"""
    display_name = "Include Drop Pack Items"

class IncludeBankerItems(Toggle):
    """Include Items from the Banker Pack"""
    display_name = "Include Banker Pack Items"

class IncludeBruceLeeItems(Toggle):
    """Include Items from the Bruce Lee Pack"""
    display_name = "Include Bruce Lee Pack Items"

class IncludeEminemItems(Toggle):
    """Include Items from the Eminem vs. Slim Shady Pack"""
    display_name = "Include Eminem vs. Slim Shady Pack Items"

class IncludeTrinityItems(Toggle):
    """Include Items from the Trinity Pack"""
    display_name = "Include Trinity Pack Items"

class IncludeConcreteArtItems(Toggle):
    """Include Items from the Street Art Pack"""
    display_name = "Include Street Art Pack Items"

class IncludeMakeshiftItems(Toggle):
    """Include Items from the Makeshift Pack"""
    display_name = "Include Makeshift Pack Items"

class IncludeLegacyItems(Toggle):
    """Include Items marked as \"Legacy\", which only affects HITMAN 2"""
    display_name = "Include Legacy Items"
    visibility = Visibility.none
# TODO: do this properly along with other H2 support (should be HITMAN 1 acess pass items in H2)

class IncludeExecutiveItems(Toggle):
    """Include Items from the HITMAN 2 Executive Pack (Included in \"HITMAN 3 Access Pass: HITMAN 2 Expansion\")"""
    display_name = "Include Executive Pack Items"

class IncludeCollectorsItems(Toggle):
    """Include Items from the HITMAN 2 Collectors Pack (Included in \"HITMAN 3 Access Pass: HITMAN 2 Expansion\")"""
    display_name = "Include Collectors Pack Items"

class IncludeSmartCasualItems(Toggle):
    """Include Items from the HITMAN 2 Smart Casual Pack (Included in \"HITMAN 3 Access Pass: HITMAN 2 Expansion\")"""
    display_name = "Include Smart Casual Pack Items"

class IncludeWinterSportsItems(Toggle):
    """Include Items from the Winter Sports Pack (Included in \"HITMAN 3 Access Pass: HITMAN 2 Expansion\")"""
    display_name = "Include Winter Sports Pack Items"

@dataclass
class HitmanOptions(PerGameCommonOptions):
    game_difficulty: GameDifficulty
    enable_itemsanity: Itemsanity
    split_itemsanity: SplitItemsanity
    enable_disguisesanity: DisguiseSanity
    enable_target_checks : CheckForTarget

    random_complications : RandomComplications
    min_number_of_complications: MinComplications
    max_number_of_complications: MaxComplications
    complications_weights : ComplicationWeights

    included_s1_locations: IncludedH1Levels
    included_s2_locations: IncludedH2Levels
    included_s2_dlc_locations: IncludedH2DLCLevels
    included_s3_locations: IncludedH3Levels

    excluded_items: ExcludedItems
    excluded_starting_items: ExcludedStartingItems
    item_packages: EnableEverythingItem

    starting_location: StartingLevel
    goal_mode: Goal
    goal_rating: GoalDifficulty
    goal_level: GoalLevel
    goal_amount: GoalAmount
    goal_required_contract_pieces: RequiredContractPieceAmount
    goal_additional_contract_pieces: AdditionalContractPieces

    levels_with_check_for_completion: CheckForCompletion
    levels_with_check_for_sa: CheckForSA
    levels_with_check_for_so: CheckForSO
    levels_with_check_for_saso: CheckForSASO

    random_targets: RandomTargets
    min_number_of_targets: MinRandomTargets
    max_number_of_targets: MaxRandomTargets

    include_deluxe_items: IncludeDeluxeItems
    include_h2_expansion_items: IncludeExpansionItems
    include_sins_items: IncludeSinsItems

    include_splitter_items: IncludeLambicItems
    include_disruptor_items: IncludePenecillinItems
    include_undying_items: IncludeSambucaItems
    include_drop_items: IncludeTomorrowlandItems
    include_banker_items: IncludeBankerItems
    include_bruce_lee_items: IncludeBruceLeeItems
    include_eminem_items: IncludeEminemItems

    include_trinity_items: IncludeTrinityItems
    include_street_art_items: IncludeConcreteArtItems
    include_makeshift_items: IncludeMakeshiftItems

    include_executive_items: IncludeExecutiveItems
    include_collectors_items: IncludeCollectorsItems
    include_smart_casual_items: IncludeSmartCasualItems
    include_winter_sports_items: IncludeWinterSportsItems

option_groups = [
        OptionGroup("Ingame Settings",[
            GameDifficulty,
            RandomTargets,
            MinRandomTargets,
            MaxRandomTargets,
            RandomComplications,
            MinComplications,
            MaxComplications,
            ComplicationWeights
        ]),
        OptionGroup("Level Settings",[
            IncludedH1Levels,
            IncludedH2Levels,
            IncludedH2DLCLevels,
            IncludedH3Levels,
            StartingLevel
        ]),
        OptionGroup("Enabled Checks",[
            CheckForTarget,
            Itemsanity,
            SplitItemsanity,
            DisguiseSanity,
            CheckForCompletion,
            CheckForSA,
            CheckForSO,
            CheckForSASO
        ]),
        OptionGroup("Goal Settings",[
            Goal,
            GoalLevel,
            GoalDifficulty,
            GoalAmount,
            RequiredContractPieceAmount,
            AdditionalContractPieces
        ]),
        OptionGroup("Item Settings",[
            EnableEverythingItem,
            ExcludedItems,
            ExcludedStartingItems
        ]),
        OptionGroup("Included Items from DLC",[
            IncludeDeluxeItems,
            IncludeExpansionItems,
            IncludeSinsItems,
            IncludeLambicItems,
            IncludePenecillinItems,
            IncludeSambucaItems,
            IncludeTomorrowlandItems,
            IncludeBankerItems,
            IncludeBruceLeeItems,
            IncludeEminemItems,
            IncludeTrinityItems,
            IncludeConcreteArtItems,
            IncludeMakeshiftItems,
            IncludeExecutiveItems,
            IncludeCollectorsItems,
            IncludeSmartCasualItems,
            IncludeWinterSportsItems
        ])
    ]