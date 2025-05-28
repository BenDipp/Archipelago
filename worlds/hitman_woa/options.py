from dataclasses import dataclass
from Options import Choice, PerGameCommonOptions, Range, Toggle, Visibility, DefaultOnToggle

class Goal(Choice):
    """The victory condition for your Archipelago run.
    -level_completion: requires beating a specific level with a specific rating 
    -contract_collection: requires collection a certain number of Contract Pieces"""
    display_name = "Goal"
    # TODO: didnt work out right now option_number_of_completions = 1
    option_level_completion = 2
    option_contract_collection = 3
    default = 2
    
class GoalDifficulty(Choice):
    """When goal is set to level_completion, which rating the goal level needs to be completed with to win."""
    display_name = "Goal Level Rating"
    option_any = 1
    option_silent_assassin = 2
    option_suit_only = 3
    option_silent_assassin_suit_only = 4
    default = 1

class GoalLevel(Choice):
    """When goal is set to level_completion, which level is the goal. If the entered level is not included with its whole season, it will be added regardless."""
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

#class GoalAmount(Range):
#    """When the goal is set to Number of Completions, how many levels must be beaten in with the selected rating to award the goal."""
#    display_name = "Goal Amount"
#    range_end = 22
#    range_start = 1
#    default = 5

class RequiredContractPieceAmount(Range):
    """When the goal is set to contract_colleciton, how many contract pieces are required to award the goal."""
    display_name = "Required Contract Pieces"
    range_end = 20
    range_start = 1
    default = 10

class PercentageOfAdditionalContractPieces(Range):
    """When the goal is set to contract_colleciton, percentage of additional contract pieces in the item pool."""
    display_name = "Percentage of Additional Contract Pieces"
    range_end = 100
    range_start = 0
    default = 20

class StartingLevel(Choice):
    """Which level is unlocked from the start. If the entered level is not included with its whole season, it will be added regardless."""
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

class IncludeH1Option(DefaultOnToggle):
    """Include Locations from Hitman 1 in the Location Pool (Sapienza, Marrakesh, Bangkok, Colorado, Hokkaido)"""
    display_name = "Include Hitman 1 Locations"

class IncludeH2Option(DefaultOnToggle):
    """Include Locations from Hitman 2 in the Location Pool (Hawkes Bay, Miami, Santa Fortuna, Mumbai, Whittleton Creek, Isle of Sgail)"""
    display_name = "Include Hitman 2 Locations"

class IncludeH2DLCOption(Toggle):
    """Include Locations from the Hitman 2 Expansion in the Location Pool (New York, Haven Island)"""
    display_name = "Include Hitman 2 Expansion Locations"

class IncludeH3Option(DefaultOnToggle):
    """Include Locations from Hitman 3 in the Location Pool (Dubai, Dartmoor, Berlin, Chongqing, Mendoza, Carpathian Mountains, Ambrose Island)"""
    display_name = "Include Hitman 3 Locations"

class CheckForCompletion(DefaultOnToggle):
    """Add a check for beating each level, regardless of Rating"""
    display_name = "Level completion checks"

class CheckForSA(Toggle):
    """Add a check for beating each level with Silent Assassin Rating"""
    display_name = "Silent Assassin checks"

class CheckForSO(Toggle):
    """Add a check for beating each level without using disguises"""
    display_name = "Suit Only checks"

class CheckForSASO(Toggle):
    """Add a check for beating each level with Silent Assassin Rating without using disguises"""
    display_name = "Silent Assassin, Suit Only checks"

class Itemsanity(Toggle):
    """Add a check for each item that can be picked up"""
    display_name = "Enable Itemsanity"

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

class IncludeGoldenItems(Toggle):
    """Include Items marked as \"LOCATION_GOLDEN\", which I don't know what it means"""
    display_name = "Include LOCAITON_GOLDEN Items"
    visibility = Visibility.none
# TODO: LOCATION_GOLDEN is Freelancer, I think but it doesnt seem to work with disableMasteryProgression

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
    starting_location: StartingLevel
    goal_mode: Goal
    goal_rating: GoalDifficulty
    goal_level: GoalLevel
    #goal_amount: GoalAmount
    goal_required_contract_pieces: RequiredContractPieceAmount
    goal_additional_contract_pieces_percent: PercentageOfAdditionalContractPieces

    include_s1_locations: IncludeH1Option
    include_s2_locations: IncludeH2Option
    include_s2_dlc_locations: IncludeH2DLCOption
    include_s3_locations: IncludeH3Option

    check_for_completion: CheckForCompletion
    check_for_sa: CheckForSA
    check_for_so: CheckForSO
    check_for_saso: CheckForSASO

    enable_itemsanity: Itemsanity

    include_deluxe_items: IncludeDeluxeItems
    include_h2_expansion_items: IncludeExpansionItems
    include_sins_items: IncludeSinsItems

    include_splitter_items: IncludeLambicItems
    include_disruptor_items: IncludePenecillinItems
    include_undying_items: IncludeSambucaItems
    include_drop_items: IncludeTomorrowlandItems

    include_trinity_items: IncludeTrinityItems
    include_street_art_items: IncludeConcreteArtItems
    include_makeshift_items: IncludeMakeshiftItems

    include_executive_items: IncludeExecutiveItems
    include_collectors_items: IncludeCollectorsItems
    include_smart_casual_items: IncludeSmartCasualItems
    include_winter_sports_items: IncludeWinterSportsItems
