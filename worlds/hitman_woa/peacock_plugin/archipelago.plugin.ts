// import archipelagoLogin from "plugins/loginData.json"
import { log, LogLevel } from "@peacockproject/core/loggingInterop"
import { Controller } from "@peacockproject/core/controller"
import { clearInventoryCache } from "@peacockproject/core/inventory"
import { getFlag, setFlag } from "@peacockproject/core/flags"
import {
    Campaign,
    ClientToServerEvent,
    ContractSession,
    GameVersion,
    GenSingleMissionFunc,
    GenSingleVideoFunc,
    PlayNextGetCampaignsHookReturn,
    RequestWithJwt,
    Unlockable,
} from "@peacockproject/core/types/types"

import { menuDataRouter } from "@peacockproject/core/menuData"
import { getHubData } from "@peacockproject/core/menus/hub"
import { configs, getVersionedConfig } from "@peacockproject/core/configSwizzleManager"
import { webFeaturesRouter } from "@peacockproject/core/webFeatures"

const contractMap: Record<string,string> = {
    "ada5f2b1-8529-48bb-a596-717f75f5eacb":"ICA Facility",
    "00000000-0000-0000-0000-000000000200":"Paris",
    "00000000-0000-0000-0000-000000000600":"Sapienza",
    "00000000-0000-0000-0000-000000000400":"Marrakesh",
    "db341d9f-58a4-411d-be57-0bc4ed85646b":"Bangkok",
    "42bac555-bbb9-429d-a8ce-f1ffdf94211c":"Colorado",
    "0e81a82e-b409-41e9-9e3b-5f82e57f7a12":"Hokkaido",
    "c65019e5-43a8-4a33-8a2a-84c750a5eeb3":"Hawkes Bay",
    "c1d015b4-be08-4e44-808e-ada0f387656f":"Miami",
    "422519be-ed2e-44df-9dac-18f739d44fd9":"Santa Fortuna",
    "0fad48d7-3d0f-4c66-8605-6cbe9c3a46d7":"Mumbai",
    "82f55837-e26c-41bf-bc6e-fa97b7981fbc":"Whittleton Creek",
    "0d225edf-40cd-4f20-a30f-b62a373801d3":"Isle of Sgail",
    "7a03a97d-238c-48bd-bda0-e5f279569cce":"New York",
    "095261b5-e15b-4ca1-9bb7-001fb85c5aaa":"Haven Island",
    "7d85f2b0-80ca-49be-a2b7-d56f67faf252":"Dubai",
    "755984a8-fb0b-4673-8637-95cfe7d34e0f":"Dartmoor",
    "ebcd14b2-0786-4ceb-a2a4-e771f60d0125":"Berlin",
    "3d0cbb8c-2a80-442a-896b-fea00e98768c":"Chongqing",
    "d42f850f-ca55-4fc9-9766-8c6a2b5c3129":"Mendoza",
    "a3e19d55-64a6-4282-bb3c-d18c3f3e6e29":"Carpathian Mountains",
    "b2aac100-dfc7-4f85-b9cd-528114436f6c":"Ambrose Island"
}
let modifiedContractMap: Record<string,string> = {}

const itemDepotToApIdMap: Record<string,number> = {
    "01ed6d15-e26e-4362-b1a6-363684a7d0fd":1, //Crowbar
    "3c24c96a-557c-472a-9d71-1a235d7383a7":2, //Hammer
    "dda002e9-02b1-4208-82a5-cf059f3c79cf":3, //Coin
    "8b37a3a8-8a20-4262-81c5-0fcd15f4bba9":4, //Emetic Rat Poison
    "6adddf7e-6879-4d51-a7e2-6a25ffdca6ae":5, //Wrench
    "7aeb740f-3d60-4e49-8d27-15a98067ce9f":6, //Lead Pipe
    "95d1c5bd-72de-4236-97c0-b96fc5d92fa8":7, //Pool Ball
    "5cc4d1ea-b4fa-4667-ba3a-b6e859f03059":8, //Brick
    "31f36818-623f-4c92-892f-d7b19bb325e1":9,   "97d74fa2-4832-4186-a447-c4b2e37d537a":9, //Bust
    "6ecf1f15-453c-4783-9c70-8777c83934d7":10, //Scissors
    "12cb6b51-a6dd-4bf5-9653-0ab727820cac":11, //Screwdriver
    "f1f89faf-a441-4492-b442-9a923b5ecfd1":12, //Letter Opener
    "a8bc4325-718e-45ba-b0e4-000729c70ce4":13, //Fire Axe
    "d8aa6eba-0cb7-4ed4-ab99-975f2793d731":14, //Fusil G2
    "7c691c03-7c6b-4eb4-9a68-898efe5eedaa":15, //Remote Explosive
    "55ed7196-2303-4af6-9fa3-45b691134561":16, //Bartoli 75R
    "d64eb5f2-1e9b-402d-855b-c714cfde50db":17, //Fire Extinguisher
    "901a3b51-51a0-4236-bdf2-23d20696b358":18, //Tactical Bartoli 12G
    "e17172cc-bf70-4df6-9828-d9856b1a24fd":19, //Kitchen Knife
    "a8a0c154-c36f-413e-8f29-b83a1b7a22f0":20, //Propane Flask
    "1bbf0ed5-0515-4599-a4c9-454ce59cff44":21, //Cleaver
    "bce6ce09-6ead-4d72-8438-2c7780770e70":22, //Frying Pan
    "987d9c9f-203d-44d9-bbf8-bf703f349565":23, //Fire Poker
    "3a8207bb-84f5-438f-8f30-5c83aef2af80":24, //Hatchet
    "58dceb1c-d7db-41dc-9750-55e3ab87fdf0":25, //Battle Axe
    "94f52181-b9ec-4363-baef-d53b4e424b74":26, //Saber
    "17615866-32e7-4e1e-951d-7ef2ada796e9":27, //Golf Club
    "510c62c2-1f40-4a4d-9e42-da677bd116e7":28, //Police Baton
    "a1f89118-d345-4367-9423-620c3ef5dfba":29, //Lethal Poison Pill Jar
    "1066917f-2e04-4c54-b8cb-55cb1dcc2f26":30, //Shovel
    "e312a416-5b56-4cb5-8994-1d4bc82fbb84":31, //Circumcision Knife
    "62c2ac2e-329e-4648-822a-e45a29a93cd0":32, //Amputation Knife
    "ce8e7099-e60d-47e8-bfd6-4918777f2c8b":33, //Toy Tank
    "ac77e98d-4ffa-4755-80fc-cd6e7adc63fb":34, //Expired Can of Spaghetti Sauce
    "afd1f201-d2a5-4d40-80b1-d81b0d9d2541":35,  "c19f796e-e23f-4429-a046-47ed3d324359":35,    "de69ce1e-a24d-4acc-895f-4c3a71f47ba8":35,  "004ecac9-6aee-4b30-a073-4399a94535d8":35, //Soda Can
    "2953e9ac-e25b-41ae-afbf-4a47f86c4f54":36, //Bartoli 75S
    "22f8ffdb-073d-48a1-abb9-13075800008e":37, //Virus Prototype
    "2c037ef5-a01b-4532-8216-1d535193a837":38, //Combat Knife
    "c21f558b-2935-41e5-88ff-642eb1761ccc":39, //Baseball Bat
    "c95c55aa-34e5-42bd-bf27-32be3978b269":40, //Explosive Golf Ball
    "a2c56798-026f-4d0b-9480-de0d2525a119":41, //Folding Knife
    "369c68f7-cbef-4e45-83c7-8acd0dc2d237":42, //Old Axe
    "25a4d780-3123-448d-a6e7-3dfdbb8c8260":43, //Radio
    "e65953cb-f954-4d21-9f11-52b454cac15e":44, //Bag of Gunpowder
    "b86b9ece-c929-44f6-8903-8f2c817e2a19":45, //Cannonball
    "7f31d897-a62f-448c-be0d-79d565e2faa7":46, //Bartoli 12G
    "5631dace-7f4a-4df8-8e97-b47373b815ff":47, //Katana
    "6e4afb04-417e-4cfc-aaa2-43f3ecca9037":48, //Shashka A33
    "16edb112-58cc-4069-a7dd-ebd258b14044":49, //Fusil G1-4
    "aa532e88-2430-432f-9818-ddb8ad80615e":50,  "01048280-0358-4f0a-95b7-1f9f665c1648":50, //Insecticide
    "22183fd3-d837-47c6-9c44-05637300af93":51, //Coconut
    "d2a7fa04-2cac-45d8-b696-47c566bb95ff":52, //Sapper's Axe
    "e755471f-e6fd-438f-b343-7c98fbb50107":53, //Apricot
    "ce633778-7424-4784-8bc2-f9d717a23709":54, //Baseball
    "c86ce2f4-7bd1-4949-acc4-54e5428d9396":55, //Cowboy Bust
    "ee25fc91-e42e-4044-99b4-b3c4206d250d":56, //Explosive Watch Battery
    "af8a7b6c-692c-4a76-b9bc-2b91ce32bcbc":57, //Nitroglycerin
    "af9ad679-6a7c-4f8e-9700-ceb5e6887666":58, //Modern Lethal Syringe
    "e206ed81-0559-4289-9fec-e6a3e9d4ee7c":59, //HX-10
    "51f6ed96-4985-4d09-8218-e3b912d025b9":60, //Branding Iron
    "8d937ed4-dc85-476b-8048-e96a8900e7bf":61, //Mannequin Arm
    "3fd9825d-8aa5-48e0-97a9-ec8f541f871a":62, //HX-7
    "5d8ca32a-fe4c-4597-b074-51e36c3de898":63, //Scalpel
    "e45c295d-60dd-4cba-a01b-0dc1b6f1b17c":64, //Botulinum Toxin
    "35efd6dc-0387-4b56-83f0-4e6609bac93f":65, //Hackl 9S Covert
    "26b5496d-9a8c-4059-9d69-d8712078a33c":66, //Kalmer 1 - Tranquilizer
    "3cf48e44-6e0f-4e4d-9d21-6a4af476118c":67, //Chloroform Flask
    "c664eb1a-41d8-4d0a-a393-d5f66f055e5e":68, //Squeaky Toy
    "e55eb9a4-e79c-43c7-970b-79e94e7683b7":69, //Shuriken
    "1973ae7e-538c-4a43-98af-208b9893d246":70, //Maori Paddle
    "59b5731d-2de8-4175-9be0-92fbc2c3e603":71, //Wristwatch Alarm
    "ffcb781c-42a1-4d6d-9e1f-30603b7b3e5f":72, //Driftwood Log
    "dac32c27-4c49-4933-bccb-56c8f526515f":73, //Car Battery
    "0ff22cf7-a472-48d6-87eb-1b307bc5c576":74, //Apple
    "3f9cf03f-b84f-4419-b831-4704cff9775c":75, //Fragmentation Grenade
    "c82fefa7-febe-46c8-90ec-c945fbef0cb4":76, //Kronstadt Octane Booster
    "74b04d1f-8ac9-46a0-9a6c-8579cf03276f":77, //Didgeridoo
    "d1f29c76-5751-4e06-b534-e6eb7522b128":78, //Android Arm
    "45c0ccfe-1ac3-4747-9571-fe7588fe6971":79, //Bag of Sugar
    "1f11f901-2dbe-4e48-a77a-74c110b93da0":80,  "4d0d6b2a-dd81-474c-a412-3bf19af8233d":80, //Fish
    "606a9606-8c05-4dcd-93fa-ec9cdc13f357":81, //Pneumatic Wrench
    "53284129-c50a-47a7-9efa-caa3b7503826":82, //Car Bomb
    "c6e9414e-e2ce-470a-95bd-14cd25225878":83, //Cocaine Brick
    "cad726d7-331d-4601-9723-6b8a17e5f91b":84, //Starfish
    "ac1f44ac-0542-4e3e-9805-81ceeb499804":85, //Cannabis Joint
    "ec31f55f-6109-4f97-9286-8f59fae666f6":86, //The Big One
    "acc9d7b8-80f1-4bb0-ba81-3a69b09e0543":87, //Meaty Bone
    "d75bef38-8a65-45f6-9cd1-ca5e23e2f79a":88, //DAK X2
    "4cc1765e-939e-4a5a-bee2-44403b47822b":89,  "aa62586e-d463-494e-b55f-177bcdf8c08c":89, //Poisonous Flower (Emetic)
    "cbf40151-cb96-435a-b683-6430370a07f2":90, //Poisonous Flower (Lethal)
    "e887e8ea-4554-41e1-b37d-d002dad04fed":91,  "963123fd-8a53-41b6-8950-335495b3f3af":91, //Lethal Poisonous Frog
    "30fa1ade-386f-49b7-bddd-a23cd912611d":92, //Letterbomb Parcel
    "248cbd89-9923-452a-8cda-a5f76d8930dc":93, //Collectors Baseball Bat
    "3e3819ca-4d19-4e0a-a238-4bd16c730e61":94, //Machete
    "c4747fa2-4958-4a02-926e-3b069cf218dc":95, //Claw Hammer
    "79b48d90-26aa-4b17-9332-599ed8e0bd7f":96, //Shashka A33 Gold
    "4b0def3b-7378-494d-b885-92c334f2f8cb":97, //Gold Idol
    "b2321154-4520-4911-9d94-9256b85e0983":98, //Sacrificial Knife
    "5ce2f842-e091-4ead-a51c-1cc406309c8d":99, //Barber Razor
    "77ecaad6-652f-480d-b365-cdf90820a5ec":100, //\"El Matador\"
    "d2f4e54f-1eb8-482d-9732-a9159b1a9229":101, //Cocaine Souvenir
    "b153112f-9cd1-4a49-a9c6-ba1a34f443ab":102, //Beak Staff
    "7268dbea-7a1c-47f5-b846-f0445404ec14":103, //Iron
    "cf4838bf-2417-4baf-ad40-50b7793040c6":104, //Chennai Cricket Ball
    "cbc38627-a3c4-4116-8731-ace217a831e7":105, //Lever
    "c008f9ce-4029-4ab4-a9c3-52868fe810ff":106, //Colored Smoke
    "40e96ed0-7668-4d65-b88a-f44bfff5f537":107, //Khatvanga
    "a804e004-7d45-42c8-87bd-b7cbcffa56cc":108, //Measuring Tape
    "43d15bea-d282-4a91-b625-8b7ba85c0ad5":109, //Druzhina 34
    "81654161-7711-4985-8056-8651a381d3ca":110, //Rake
    "e638b949-9b96-4c41-bec4-0a8fbfb05c75":111, //DAK X2 Covert Special
    "042fae7b-fe9e-4a83-ac7b-5c914a71b2ca":112, //Flash Grenade
    "5952b621-fee9-4699-809c-8889abadfdb8":113, //Blueberry Muffin
    "a96cdbd8-9657-416a-87bf-d2ed21840794":114, //Newspaper
    "ef63eda6-6411-4ce0-b35b-143fc5767fc0":115, //Lethal Pills
    "c5ec6168-2e5e-4340-b71a-c60f2ee6bd66":116, //Emetic Pills
    "092f6514-c34e-4d04-8d28-7ebbe14230d1":117, //\"Rude Ruby\"
    "ccdd6689-092d-49b2-85f8-416a02e25566":118, //Remote CX Demo Block
    "2f6eec38-45ea-49df-83a2-0b98a858e60a":119, //RS-15
    "a15af673-8e21-47e3-bdfa-f5dea7b5f9e9":120, //TAC-4 AR Auto
    "6b93848c-8f1d-42eb-816f-bab61b56d8a5":121, //Fusil G1-4|C
    "0705964d-dab5-45b6-96ae-30cd4c2f0dec":122, //Paddle
    "bad168bb-3629-42b3-bc57-604b03a81d30":123, //Package
    "0f901c2c-3bcc-42f8-abc0-1f9b81fcd72f":124, //Cigar Box
    "2147b6cd-5a42-4cd6-b366-2c5c50d97db7":125, //Fishing Line
    "94c2b206-d011-4358-a6b3-c8a6042ab2c2":126, //Wooden Torch
    "1a105af8-fd30-447f-8b2c-f908f702e81c":127, //Garden Fork
    "3a359494-ee05-4fea-beac-8726233a55bf":128, //Whiskey Bottle
    "5ad01c38-244a-4b75-94d6-624850d2dc92":129, //Spray Can
    "1050c8d3-43d6-4bcf-a5d3-0ca994121871":130, //Vodka Bottle
    "84f50c4c-de1d-41f3-8021-1cba7df987cd":131, //Soap
    "903d273c-c750-441d-916a-31557fea3382":132, //Banana
    "72cb6124-36eb-4c25-8da0-78d4c5fac459":133, //Durian
    "66024572-7838-42d3-8c7b-c651e259438e":134, //Meat Fork
    "5db9cefd-391e-4c35-a4c4-bb672ac9b996":135, //Kukri Machete
    "7bc45270-83fe-4cf6-ad10-7d1b0cf3a3fd":136, //Seashell
    "7d668011-77f9-4cae-97f1-e3eda5e0c8b2":137, //Lethal Poison Vial
    "af82349c-259f-4bdd-8be7-d5ff61695c29":138, //Emetic Gas Grenade
    "b5481de5-6446-46b3-903f-e0040f46b7f0":139, //Sawed-Off Bartoli 12G
    "58a036dc-79d4-4d64-8bf5-3faafa3cfead":140, //Hook
    "79f8c0e9-4690-4ebf-b2b3-fd8411a1407f":141, //Brine-Damaged SMG
    "a83349bf-3d9c-43ec-92ee-c8c98cbeabc1":142, //Molotov Cocktail
    "8f1bae41-3570-40cc-be87-77cb6a4af86c":143, //Makeshift Explosive
    "3dbbbb5e-61a7-4cae-8df0-0e911e744dca":144, //Remote CX Demo Block MK II
    "d73251b4-4860-4b5b-8376-7c9cf2a054a2":145, //Scrap Sword
    "e98f44fd-7f36-46a8-ae3c-bf080e8454d3":146, //Umbrella
    "42c7bb52-a71b-489c-8a74-7db0c09ba313":147, //Shears
    "9e728dc1-3344-4615-be7a-1bcbdd7ad4aa":148, //Hobby Knife
    "6738e8ad-b8d0-496a-9749-d27a93b40113":149, //Militia-Issued HX-10 SMG
    "fc715a9a-3bf1-4768-bd67-0def61b92551":150, //Remote Breaching Charge
    "dc10958c-e3dc-447b-b9f4-8c4bde86d108":151, //Doubloon
    "fba6e133-78d1-4af1-8450-1ff30466c553":152, //Jarl's Pirate Saber
    "23b8ad17-1913-40ce-b3bc-2c92317801dd":153, //Mace
    "12200bd8-9605-4111-8b26-4e73cb07d816":154, //Broadsword
    "9a7711c7-ede9-4230-853e-ab94c65fc0c9":155, //Viking Axe
    "e0de34ce-f8d1-428b-8b37-0dae7398bde3":156, //HX-7 Covert
    "92d68841-8552-40b1-b8a5-c36c6efdb6b1":157, //Aztec Necklace
    "c88a59cd-d5cc-4435-a3f1-2312abcc817e":158, //Imperial Filigree Egg
    "cb34f363-3534-46ff-b036-d49f1329f300":159, //Torch
    "1e11fbea-cd51-48bf-8316-a050772d6135":160, //Hackl 9S
    "da6ae60b-092d-4ad9-aa3c-322c8cb21985":161, //Commemorative Token
    "25bc1a6d-c618-43ee-9c1f-81347ed430a6":162, //Cheeseburger
    "54b1ffd7-5290-4b58-8e1c-53fd038a08f5":163, //Small Goldbar
    "4fad7437-59e9-4ca9-9b31-a6d97484216b":164, //Violin
    "7685be69-ff8f-479c-91b9-7347253f8bf1":165, //Earphones
    "9488fa1e-10e1-49c9-bb24-6635d2e5bd49":166, //Tanto
    "6d4c88f3-9a09-453c-9a6e-a081f1136bf3":167, //Burial Dagger
    "8598ae82-53ac-43ba-9f43-30140d6ba7ee":168, //Golden Sawed Off Bartoli 12G
    "59e407df-c49b-4abe-a1be-0806b026e47e":169, //Concussion Grenade
    "0576a20c-581b-4705-8b9d-464e077d117e":170, //Wet Floor Sign
    "5c211971-235a-4856-9eea-fe890940f63a":171, //Antique Carved Knife
    "4292fe64-aac6-4bbe-be73-31671640172a":172, //Goldbar
    "6b87c27d-0d73-4c63-b852-5a9c7a9ffb90":173, //Feather Duster
    "280739c7-9d93-48b9-840e-694883e76700":174, //Stethoscope
    "1c50d6e0-11c8-4cbc-be05-f51a8e5013be":175, //Modern Emetic Syringe
    "9c649932-7329-4cc3-a8cb-a32cae5dd7ca":176, //Kettlebell
    "a2fce6cb-7b4a-4d2e-81b7-919bf7c5b7ad":177, //Pearl
    "b4d4ed1a-0687-48a9-a731-0e3b99494eb6":178, //Ornate Scimitar
    "706cb615-e66d-49f3-86bb-899fa7117bcf":179, //Model of the Sceptre
    "98bf7fc1-7857-4999-bc99-586c49f24017":180, //Classic Coin
    "4eede7ee-582b-49a4-b438-2418d82671d9":181, //Walking Cane
    "58769c58-3e70-4746-be8e-4c7114f8c2bb":182, //Unicorn Horn
    "785c3c6b-1272-4853-94f0-a41d52f64795":183, //Bartoli Hunting Shotgun
    "c45e59f4-d8e1-4c37-b079-8b74b1fe9b24":184, //Modern Sedative Syringe
    "719ba201-3688-4984-afb0-81dc2cc95ec1":185, //Bartoli Woodsman Hunting Rifle
    "fb5319c4-f3ff-4ce6-9a78-2fc2c33bd19c":186, //Bird's Egg
    "8ee26350-67f9-48bd-983e-8f276eea04cc":187, //Poisonous (Emetic) Mushroom
    "e30a5b15-ce4d-41d5-a2a5-08dec9c4fe79":188, //Concealable Knife
    "407bf3c3-6319-4573-b193-2611b0ee397e":189, //ICA Remote Audio Distraction Mk III
    "0f9608e9-6e42-49b9-b4cd-9aaebba8458f":190, //Hackl Leviathan Sniper Rifle Covert
    "8a30c788-049a-4b83-b148-1a6db49d2ae5":191, //ICA SMG Raptor Covert
    "f6f525d2-a28c-4548-825b-f7ce93f6577c":192, //Fusil X2000 Stealth
    "299eae90-4744-4557-b30b-71382cba2839":193, //Cabernet Sauvignon
    "2b1bd2af-554e-4ea7-a717-3f6d0eb0215f":194, //Grape Knife
    "3fbd6da4-c61c-40d6-9494-8277d2e172e4":195, //Grapevine
    "40766e9d-eb46-474e-b5ce-927e3e70f0c6":196, //Pinot Noir
    "3f9ed406-8de0-4466-b393-38a7f905d859":197, //Malbec
    "2d960bf0-217c-400d-a1ee-f721e18f2926":198, //1945 Grand Paladin
    "a8309099-1b89-4492-bf37-37d4312b6615":199, //Sieger AR552 Tactical
    "7d64d9df-5d30-4e98-9af0-7562ee145d5c":200, //Sieger 300 Tactical
    "b1b40b14-eded-404f-b933-c4da15e85644":201, "d689f87e-c3b1-4018-8e78-2f0025cde2a9":201, //Icicle
    "6294f1c4-68db-477f-b7c9-8c9825c077a1":202, //Rusty Crowbar
    "a494c3c8-9a41-4398-9542-559e6a5dc1cb":203, //ICA SMG White Raptor Covert
    "c716ebb8-cc0e-4e60-9335-844a0d7e645d":204, //HWK21 Pale
    "ecf022db-ecfd-48c0-97b5-2258e4e89a65":205, //Rusty Screwdriver
    "4e92b3c5-3358-44aa-8a87-f7f349f46f44":206, //ICA Tactical Shotgun Covert
    "a02af9a5-aefb-47e0-9d67-51cc9ec89774":207, //Flash Grenade Mk III
    "1a11a060-358c-4054-98ec-d3491af1d7c6":208, //Fiber Wire
    "f93b99a3-aef6-419f-b303-59470577696d":209 //ICA19 Black Lily
}
const locationNameToApIdMap: Record<string,number> = {
    "ICA Facility Completed":1000,
    "Paris Completed":1001,
    "Sapienza Completed":1002,
    "Marrakesh Completed":1003,
    "Bangkok Completed":1004,
    "Colorado Completed":1005,
    "Hokkaido Completed":1006,
    "Hawkes Bay Completed":1007,
    "Miami Completed":1008,
    "Santa Fortuna Completed":1009,
    "Mumbai Completed":1010,
    "Whittleton Creek Completed":1011,
    "Isle of Sgail Completed":1012,
    "New York Completed":1013,
    "Haven Island Completed":1014,
    "Dubai Completed":1015,
    "Dartmoor Completed":1016,
    "Berlin Completed":1017,
    "Chongqing Completed":1018,
    "Mendoza Completed":1019,
    "Carpathian Mountains Completed":1020,
    "Ambrose Island Completed":1021,
    "ICA Facility Completed - Silent Assassin":1022,
    "Paris Completed - Silent Assassin":1023,
    "Sapienza Completed - Silent Assassin":1024,
    "Marrakesh Completed - Silent Assassin":1025,
    "Bangkok Completed - Silent Assassin":1026,
    "Colorado Completed - Silent Assassin":1027,
    "Hokkaido Completed - Silent Assassin":1028,
    "Hawkes Bay Completed - Silent Assassin":1029,
    "Miami Completed - Silent Assassin":1030,
    "Santa Fortuna Completed - Silent Assassin":1031,
    "Mumbai Completed - Silent Assassin":1032,
    "Whittleton Creek Completed - Silent Assassin":1033,
    "Isle of Sgail Completed - Silent Assassin":1034,
    "New York Completed - Silent Assassin":1035,
    "Haven Island Completed - Silent Assassin":1036,
    "Dubai Completed - Silent Assassin":1037,
    "Dartmoor Completed - Silent Assassin":1038,
    "Berlin Completed - Silent Assassin":1039,
    "Chongqing Completed - Silent Assassin":1040,
    "Mendoza Completed - Silent Assassin":1041,
    "Carpathian Mountains Completed - Silent Assassin":1042,
    "Ambrose Island Completed - Silent Assassin":1043,
    "ICA Facility Completed - Suit Only":1044,
    "Paris Completed - Suit Only":1045,
    "Sapienza Completed - Suit Only":1046,
    "Marrakesh Completed - Suit Only":1047,
    "Bangkok Completed - Suit Only":1048,
    "Colorado Completed - Suit Only":1049,
    "Hokkaido Completed - Suit Only":1050,
    "Hawkes Bay Completed - Suit Only":1051,
    "Miami Completed - Suit Only":1052,
    "Santa Fortuna Completed - Suit Only":1053,
    "Mumbai Completed - Suit Only":1054,
    "Whittleton Creek Completed - Suit Only":1055,
    "Isle of Sgail Completed - Suit Only":1056,
    "New York Completed - Suit Only":1057,
    "Haven Island Completed - Suit Only":1058,
    "Dubai Completed - Suit Only":1059,
    "Dartmoor Completed - Suit Only":1060,
    "Berlin Completed - Suit Only":1061,
    "Chongqing Completed - Suit Only":1062,
    "Mendoza Completed - Suit Only":1063,
    "Carpathian Mountains Completed - Suit Only":1064,
    "Ambrose Island Completed - Suit Only":1065,
    "ICA Facility Completed - Silent Assassin, Suit Only":1066,
    "Paris Completed - Silent Assassin, Suit Only":1067,
    "Sapienza Completed - Silent Assassin, Suit Only":1068,
    "Marrakesh Completed - Silent Assassin, Suit Only":1069,
    "Bangkok Completed - Silent Assassin, Suit Only":1070,
    "Colorado Completed - Silent Assassin, Suit Only":1071,
    "Hokkaido Completed - Silent Assassin, Suit Only":1072,
    "Hawkes Bay Completed - Silent Assassin, Suit Only":1073,
    "Miami Completed - Silent Assassin, Suit Only":1074,
    "Santa Fortuna Completed - Silent Assassin, Suit Only":1075,
    "Mumbai Completed - Silent Assassin, Suit Only":1076,
    "Whittleton Creek Completed - Silent Assassin, Suit Only":1077,
    "Isle of Sgail Completed - Silent Assassin, Suit Only":1078,
    "New York Completed - Silent Assassin, Suit Only":1079,
    "Haven Island Completed - Silent Assassin, Suit Only":1080,
    "Dubai Completed - Silent Assassin, Suit Only":1081,
    "Dartmoor Completed - Silent Assassin, Suit Only":1082,
    "Berlin Completed - Silent Assassin, Suit Only":1083,
    "Chongqing Completed - Silent Assassin, Suit Only":1084,
    "Mendoza Completed - Silent Assassin, Suit Only":1085,
    "Carpathian Mountains Completed - Silent Assassin, Suit Only":1086,
    "Ambrose Island Completed - Silent Assassin, Suit Only":1087
}
const baseId = 2023011800
const logTag = "Archipelago Plugin"
let currentSeed = ""
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apItemMap: Record<string, any> = {
"1":{apItemName:"Level - ICA Facility",unlockableId:"FACILITY"},
"2":{apItemName:"Level - Paris",unlockableId:"PARIS"},
"3":{apItemName:"Level - Sapienza",unlockableId:"SAPIENZA"},
"4":{apItemName:"Level - Marrakesh",unlockableId:"MARRAKESH"},
"5":{apItemName:"Level - Bangkok",unlockableId:"BANGKOK"},
"6":{apItemName:"Level - Colorado",unlockableId:"COLORADO"},
"7":{apItemName:"Level - Hokkaido",unlockableId:"HOKKAIDO"},
"8":{apItemName:"Level - Hawkes Bay",unlockableId:"NEWZEALAND"},
"9":{apItemName:"Level - Miami",unlockableId:"MIAMI"},
"10":{apItemName:"Level - Santa Fortuna",unlockableId:"COLOMBIA"},
"11":{apItemName:"Level - Mumbai",unlockableId:"MUMBAI"},
"12":{apItemName:"Level - Whittleton Creek",unlockableId:"NORTHAMERICA"},
"13":{apItemName:"Level - Isle of Sgail",unlockableId:"THEISLAND"},
"14":{apItemName:"Level - New York",unlockableId:"GREEDY"},
"15":{apItemName:"Level - Haven Island",unlockableId:"STINGRAY"},
"16":{apItemName:"Level - Dubai",unlockableId:"GOLDEN"},
"17":{apItemName:"Level - Dartmoor",unlockableId:"ANCESTRAL"},
"18":{apItemName:"Level - Berlin",unlockableId:"EDGY"},
"19":{apItemName:"Level - Chongqing",unlockableId:"WET"},
"20":{apItemName:"Level - Mendoza",unlockableId:"ELEGANT"},
"21":{apItemName:"Level - Carpathian Mountains",unlockableId:"TRAPPED"},
"22":{apItemName:"Level - Ambrose Island",unlockableId:"ROCKY"},
"23":{apItemName:"Suit - 47's Signature Suit",unlockableId:"TOKEN_OUTFIT_HITMANSUIT"},
"24":{apItemName:"Suit - Tuxedo",unlockableId:"TOKEN_OUTFIT_PARIS_HERO_PARISSUIT"},
"25":{apItemName:"Suit - Requiem Suit",unlockableId:"TOKEN_OUTFIT_LEGACY_HERO_REQUIEMSUIT"},
"26":{apItemName:"Suit - Tactical Turtleneck",unlockableId:"TOKEN_OUTFIT_GREENLAND_HERO_TRAININGSUIT"},
"27":{apItemName:"Suit - Italian Suit",unlockableId:"TOKEN_OUTFIT_SAPIENZA_HERO_SAPIENZASUIT"},
"28":{apItemName:"Suit - Italian Suit (No Glasses)",unlockableId:"TOKEN_OUTFIT_SAPIENZA_HERO_SAPIENZASUIT_NOGLASSES"},
"29":{apItemName:"Suit - Summer Suit",unlockableId:"TOKEN_OUTFIT_MARRAKESH_HERO_MARRAKESHSUIT"},
"30":{apItemName:"Suit - Casual Suit",unlockableId:"TOKEN_OUTFIT_BANGKOK_HERO_BANGKOKSUIT"},
"31":{apItemName:"Suit - Recon Gear",unlockableId:"TOKEN_OUTFIT_HOKKAIDO_HERO_FLUSUIT"},
"32":{apItemName:"Suit - Tactical Gear",unlockableId:"TOKEN_OUTFIT_COLORADO_HERO_COLORADOSUIT"},
"33":{apItemName:"Suit - VIP Patient",unlockableId:"TOKEN_OUTFIT_HOKKAIDO_HERO_HOKKAIDOSUIT"},
"34":{apItemName:"Suit - Ninja",unlockableId:"TOKEN_OUTFIT_HOKKAIDO_HERO_NINJASUIT"},
"35":{apItemName:"Suit - Absolution Suit",unlockableId:"TOKEN_OUTFIT_LEGACY_HERO_ABSOLUTIONSUIT"},
"36":{apItemName:"Suit - Blood Money Suit with Gloves",unlockableId:"TOKEN_OUTFIT_LEGACY_HERO_BLOODMONEYSUIT"},
"37":{apItemName:"Suit - 47's Signature Suit with Gloves",unlockableId:"TOKEN_OUTFIT_LEGACY_HERO_SIGNATURESUITANDGLOVES"},
"38":{apItemName:"Suit - Tuxedo with Gloves",unlockableId:"TOKEN_OUTFIT_HERO_PARISSUITANDGLOVES"},
"39":{apItemName:"Suit - Italian Suit with Gloves",unlockableId:"TOKEN_OUTFIT_HERO_SAPIENZASUITANDGLOVES"},
"40":{apItemName:"Suit - Summer Suit with Gloves",unlockableId:"TOKEN_OUTFIT_HERO_MARRAKESHSUITANDGLOVES"},
"41":{apItemName:"Suit - Casual Suit with Gloves",unlockableId:"TOKEN_OUTFIT_HERO_BANGKOKSUITANDGLOVES"},
"42":{apItemName:"Suit - Tactical Gear with Hunter's Hat",unlockableId:"TOKEN_OUTFIT_HERO_COLORADOSUIT_ALTERNATIVE"},
"43":{apItemName:"Suit - White Yukata",unlockableId:"TOKEN_OUTFIT_HERO_HOKKAIDOSUIT_ET_ALTERNATIVE"},
"44":{apItemName:"Suit - Terminus",unlockableId:"TOKEN_OUTFIT_HERO_TERMINUS_SUIT"},
"45":{apItemName:"Suit - Winter Suit",unlockableId:"TOKEN_OUTFIT_HERO_WINTER_SUIT"},
"46":{apItemName:"Suit - Futo Suit",unlockableId:"TOKEN_OUTFIT_HERO_MINININJA_SUIT"},
"47":{apItemName:"Suit - Freedom Phantom Suit",unlockableId:"TOKEN_OUTFIT_HERO_FREEDOMFIGHTERS_SUIT"},
"48":{apItemName:"Suit - Lynch Suit",unlockableId:"TOKEN_OUTFIT_HERO_LYNCH_SUIT"},
"49":{apItemName:"Suit - Santa 47",unlockableId:"TOKEN_OUTFIT_HERO_SANTACLAUS_SUIT"},
"50":{apItemName:"Starting Location - Hokkaido - Tobias Rieper's Suite",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_DEFAULT"},
"51":{apItemName:"Starting Location - Hokkaido - Infiltrating Along the Mountain Path",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_NINJA"},
"52":{apItemName:"Starting Location - Hokkaido - Undercover in the Operating Theater",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_OPERATINGTHEATER"},
"53":{apItemName:"Starting Location - Hokkaido - Undercover in the Kitchen",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_KITCHEN"},
"54":{apItemName:"Starting Location - Hokkaido - Spa",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_SPA"},
"55":{apItemName:"Starting Location - Hokkaido - Morgue",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_MORGUE"},
"56":{apItemName:"Starting Location - Hokkaido - Undercover in the Garden",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_GARDEN"},
"57":{apItemName:"Starting Location - Hokkaido - Undercover in the Staff Quarters",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_SLEEPINGQUARTERS"},
"58":{apItemName:"Starting Location - Hokkaido - Restaurant",unlockableId:"STARTING_LOCATION_HOKKAIDO_SNOWCRANE_RESTAURANT"},
"59":{apItemName:"Starting Location - Colorado - Undercover in the Farm House",unlockableId:"STARTING_LOCATION_COLORADO_BULL_HACKER_ROOM"},
"60":{apItemName:"Starting Location - Colorado - West Bridge",unlockableId:"STARTING_LOCATION_COLORADO_WEST_BRIDGE"},
"61":{apItemName:"Starting Location - Colorado - Old Orchard",unlockableId:"STARTING_LOCATION_COLORADO_ORCHARD"},
"62":{apItemName:"Starting Location - Colorado - Water Tower",unlockableId:"STARTING_LOCATION_COLORADO_WATER_TOWER"},
"63":{apItemName:"Starting Location - Colorado - Undercover in the Garage",unlockableId:"STARTING_LOCATION_COLORADO_BULL_COURTYARD_GARAGE"},
"64":{apItemName:"Starting Location - Colorado - Undercover by the Greenhouse",unlockableId:"STARTING_LOCATION_COLORADO_BULL_GREENHOUSE"},
"65":{apItemName:"Starting Location - Colorado - Undercover on the Demolition Range",unlockableId:"STARTING_LOCATION_COLORADO_BULL_DEMOLITION_AREA"},
"66":{apItemName:"Starting Location - Bangkok - 47's Suite",unlockableId:"STARTING_LOCATION_BANGKOK_TIGER_47_SUITE"},
"67":{apItemName:"Starting Location - Bangkok - Undercover by the Security Hut",unlockableId:"STARTING_LOCATION_BANGKOK_SECURITY_HUT"},
"68":{apItemName:"Starting Location - Bangkok - Undercover at the Himmapan Bar",unlockableId:"STARTING_LOCATION_BANGKOK_BAR"},
"69":{apItemName:"Starting Location - Bangkok - Undercover in the Restaurant Kitchen",unlockableId:"STARTING_LOCATION_BANGKOK_TIGER_RESTAURANT_KITCHEN"},
"70":{apItemName:"Starting Location - Bangkok - Undercover in the Linen Room",unlockableId:"STARTING_LOCATION_BANGKOK_TIGER_LINEN_ROOM"},
"71":{apItemName:"Starting Location - Bangkok - Undercover in the 2nd Floor Hallway",unlockableId:"STARTING_LOCATION_BANGKOK_TIGER_CREW_ROOM"},
"72":{apItemName:"Starting Location - Bangkok - Riverside Landing",unlockableId:"STARTING_LOCATION_BANGKOK_TIGER_FUMIGATION_AREA"},
"73":{apItemName:"Starting Location - Bangkok - Undercover in the Side Garden",unlockableId:"STARTING_LOCATION_BANGKOK_GARDEN"},
"74":{apItemName:"Starting Location - Marrakesh - Lamp Store Rooftop",unlockableId:"STARTING_LOCATION_MARRAKESH_LAMPSTORE_ROOF"},
"75":{apItemName:"Starting Location - Marrakesh - Undercover in the Courtyard Club",unlockableId:"STARTING_LOCATION_MARRAKESH_SHISHA_CAFE"},
"76":{apItemName:"Starting Location - Marrakesh - Undercover on the West Bazaar Rooftop",unlockableId:"STARTING_LOCATION_MARRAKESH_SNIPER_ROOF"},
"77":{apItemName:"Starting Location - Marrakesh - Undercover at the Snail Stand",unlockableId:"STARTING_LOCATION_MARRAKESH_SNAIL_VENDOR"},
"78":{apItemName:"Starting Location - Marrakesh - Consulate Parking Garage",unlockableId:"STARTING_LOCATION_MARRAKESH_SPIDER_CONSULATE_BASEMENT"},
"79":{apItemName:"Starting Location - Hokkaido - Bar",unlockableId:"STARTING_LOCATION_HOKKAIDO_BAR"},
"80":{apItemName:"Starting Location - Paris - STARTING_LOCATION_PARIS_WATER",unlockableId:"STARTING_LOCATION_PARIS_WATER"},
"81":{apItemName:"Starting Location - STARTING_LOCATION_MAGNOLIA",unlockableId:"STARTING_LOCATION_MAGNOLIA"},
"82":{apItemName:"Starting Location - STARTING_LOCATION_BELLFLOWER_LEVEL1",unlockableId:"STARTING_LOCATION_BELLFLOWER_LEVEL1"},
"83":{apItemName:"Starting Location - STARTING_LOCATION_BELLFLOWER_LEVEL2",unlockableId:"STARTING_LOCATION_BELLFLOWER_LEVEL2"},
"84":{apItemName:"Starting Location - STARTING_LOCATION_BELLFLOWER_LEVEL3",unlockableId:"STARTING_LOCATION_BELLFLOWER_LEVEL3"},
"85":{apItemName:"Suit - TOKEN_OUTFIT_NEWZEALAND_HERO_NEWZEALANDSUIT",unlockableId:"TOKEN_OUTFIT_NEWZEALAND_HERO_NEWZEALANDSUIT"},
"86":{apItemName:"Suit - TOKEN_OUTFIT_MIAMI_HERO_MIAMISUIT",unlockableId:"TOKEN_OUTFIT_MIAMI_HERO_MIAMISUIT"},
"87":{apItemName:"Suit - Florida Fit With Gloves",unlockableId:"TOKEN_OUTFIT_FLAMINGO_ELUSIVE_SUIT"},
"88":{apItemName:"Suit - TOKEN_OUTFIT_COLOMBIA_HERO_COLOMBIASUIT",unlockableId:"TOKEN_OUTFIT_COLOMBIA_HERO_COLOMBIASUIT"},
"89":{apItemName:"Suit - Casual Tourist With Gloves",unlockableId:"TOKEN_OUTFIT_HIPPO_ELUSIVE_SUIT"},
"90":{apItemName:"Suit - TOKEN_OUTFIT_MUMBAI_HERO_MUMBAISUIT",unlockableId:"TOKEN_OUTFIT_MUMBAI_HERO_MUMBAISUIT"},
"91":{apItemName:"Suit - Imperial Classic With Gloves",unlockableId:"TOKEN_OUTFIT_MONGOOSE_ELUSIVE_SUIT"},
"92":{apItemName:"Suit - TOKEN_OUTFIT_NORTHAMERICA_HERO_NORTHAMERICASUIT",unlockableId:"TOKEN_OUTFIT_NORTHAMERICA_HERO_NORTHAMERICASUIT"},
"93":{apItemName:"Suit - Subburban Suit With Driving Gloves",unlockableId:"TOKEN_OUTFIT_NORTHAMERICA_ELUSIVE_SUIT"},
"94":{apItemName:"Suit - TOKEN_OUTFIT_NORTHSEA_HERO_NORTHSEASUIT",unlockableId:"TOKEN_OUTFIT_NORTHSEA_HERO_NORTHSEASUIT"},
"95":{apItemName:"Suit - Tuxedo, Mask and Gloves",unlockableId:"TOKEN_OUTFIT_MAGPIE_ELUSIVE_SUIT"},
"96":{apItemName:"Suit - The New Yorker",unlockableId:"TOKEN_OUTFIT_GREEDY_HERO_GREEDYSUIT"},
"97":{apItemName:"Suit - The Tropical Islander",unlockableId:"TOKEN_OUTFIT_OPULENT_HERO_OPULENTSUIT"},
"98":{apItemName:"Suit - Midnight Black Suit",unlockableId:"TOKEN_OUTFIT_MIDNIGHT_BLACK_COLLECTORS"},
"99":{apItemName:"Suit - Black Winter Suit",unlockableId:"TOKEN_OUTFIT_PLAYED_ELUSIVE_SUIT"},
"100":{apItemName:"Suit - The Undying Look",unlockableId:"TOKEN_OUTFIT_ELUSIVE_COMPLETE_12_SUIT"},
"101":{apItemName:"Suit - Casual Undercover",unlockableId:"TOKEN_OUTFIT_ELUSIVE_COMPLETE_15_SUIT"},
"102":{apItemName:"Suit - Classic All-Black Suit",unlockableId:"TOKEN_OUTFIT_CLASSICS_REWARD_BLACK_SUIT"},
"103":{apItemName:"Suit - Blue Flamingo Suit",unlockableId:"TOKEN_OUTFIT_REWARD_CHLORINE_FLAMINGO_SUIT"},
"104":{apItemName:"Suit - Phantom Suit",unlockableId:"TOKEN_OUTFIT_GHOSTMODE_PHANTOM_REWARD_SUIT"},
"105":{apItemName:"Suit - Snow Festival Suit",unlockableId:"TOKEN_OUTFIT_REWARD_SNOWFESTIVAL_SUIT"},
"106":{apItemName:"Suit - Winter Sports Suit",unlockableId:"TOKEN_OUTFIT_ARCTICPACK_SUIT"},
"107":{apItemName:"Suit - Clown Suit",unlockableId:"TOKEN_OUTFIT_PARIS_CLOWN"},
"108":{apItemName:"Suit - Smart Casual Suit",unlockableId:"TOKEN_OUTFIT_URBAN_CLASSIC"},
"109":{apItemName:"Suit - The Tropical Suit",unlockableId:"TOKEN_OUTFIT_STINGRAY_MASTERY_REWARD_SUIT"},
"110":{apItemName:"Suit - Summer Suave Suit",unlockableId:"TOKEN_OUTFIT_HOT_SUMMER_SUIT"},
"111":{apItemName:"Suit - Tactical Wetsuit",unlockableId:"TOKEN_OUTFIT_WET_SUIT"},
"112":{apItemName:"Suit - The Cashmerian",unlockableId:"TOKEN_OUTFIT_SNAKE_CHARMER_SUIT"},
"113":{apItemName:"Suit - Raven Suit",unlockableId:"TOKEN_OUTFIT_MARRAKESH_DARK_SNIPER"},
"114":{apItemName:"Suit - Cowboy Suit",unlockableId:"TOKEN_OUTFIT_HOKKAIDO_COWBOY"},
"115":{apItemName:"Suit - TOKEN_OUTFIT_WELCOME_SUIT",unlockableId:"TOKEN_OUTFIT_WELCOME_SUIT"},
"116":{apItemName:"Suit - The New Yorker with Gloves",unlockableId:"TOKEN_OUTFIT_BANK_STARTING_SUIT_REWARD"},
"117":{apItemName:"Suit - The Greek Fire Suit",unlockableId:"TOKEN_OUTFIT_TOMORROWLAND_SUIT_REWARD"},
"118":{apItemName:"Suit - The Club Boom DJ Suit",unlockableId:"TOKEN_OUTFIT_TOMORROWLAND_DJSUIT_REWARD"},
"119":{apItemName:"Starting Location - Marrakesh - STARTING_LOCATION_MARRAKESH_DARK_ROOFTOP",unlockableId:"STARTING_LOCATION_MARRAKESH_DARK_ROOFTOP"},
"120":{apItemName:"Starting Location - Marrakesh - Undercover in the Consulate",unlockableId:"STARTING_LOCATION_MARRAKESH_SPIDER_CONSULATE_CLEANING_TROLLEY"},
"121":{apItemName:"Starting Location - Marrakesh - Undercover in Zaydan's Compound",unlockableId:"STARTING_LOCATION_MARRAKESH_SPIDER_SCHOOL_DORMITORY"},
"122":{apItemName:"Starting Location - Marrakesh - School Alley",unlockableId:"STARTING_LOCATION_MARRAKESH_SPIDER_SCHOOL_ALLEY"},
"123":{apItemName:"Starting Location - Paris - Undercover at IAGO Auction",unlockableId:"STARTING_LOCATION_PARIS_PEACOCK_AUCTION"},
"124":{apItemName:"Starting Location - Paris - Undercover in Locker Room",unlockableId:"STARTING_LOCATION_PARIS_PEACOCK_LOCKERROOM"},
"125":{apItemName:"Starting Location - Paris - Undercover in Kitchen",unlockableId:"STARTING_LOCATION_PARIS_PEACOCK_BASEMENT_KITCHEN"},
"126":{apItemName:"Starting Location - Paris - Undercover in Dressing Area",unlockableId:"STARTING_LOCATION_PARIS_PEACOCK_DRESSINGROOM"},
"127":{apItemName:"Starting Location - Paris - Pile-Driver Barge",unlockableId:"STARTING_LOCATION_PARIS_SNIPERBARGE"},
"128":{apItemName:"Starting Location - Paris - Undercover in AV Center",unlockableId:"STARTING_LOCATION_PARIS_PEACOCK_AVTECH"},
"129":{apItemName:"Starting Location - Paris - Attic",unlockableId:"STARTING_LOCATION_PARIS_PEACOCK_ATTIC"},
"130":{apItemName:"Starting Location - Paris - Palace Garden",unlockableId:"STARTING_LOCATION_PARIS_PALACEGARDEN"},
"131":{apItemName:"Starting Location - Sapienza - Undercover in Field Lab",unlockableId:"STARTING_LOCATION_SAPIENZA_OCTOPUS_BIOLAB"},
"132":{apItemName:"Starting Location - Sapienza - Undercover as Security Staff",unlockableId:"STARTING_LOCATION_SAPIENZA_OCTOPUS_LEMONGARDEN"},
"133":{apItemName:"Starting Location - Sapienza - Undercover in Mansion Garden",unlockableId:"STARTING_LOCATION_SAPIENZA_OCTOPUS_MANSIONGARDEN"},
"134":{apItemName:"Starting Location - Sapienza - Undercover in Mansion Kitchen",unlockableId:"STARTING_LOCATION_SAPIENZA_OCTOPUS_MANSIONKITCHEN"},
"135":{apItemName:"Starting Location - Sapienza - Via Valle del Sole 9",unlockableId:"STARTING_LOCATION_SAPIENZA_ABANDONEDSHOP"},
"136":{apItemName:"Starting Location - Sapienza - Main Square Tower",unlockableId:"STARTING_LOCATION_SAPIENZA_CAFETOWER"},
"137":{apItemName:"Starting Location - Sapienza - Church Morgue",unlockableId:"STARTING_LOCATION_SAPIENZA_CHURCHMORGUE"},
"138":{apItemName:"Starting Location - Sapienza - Harbor",unlockableId:"STARTING_LOCATION_SAPIENZA_HARBOUR"},
"139":{apItemName:"Starting Location - Sapienza - Sapienza Ruins",unlockableId:"STARTING_LOCATION_SAPIENZA_RUINS"},
"140":{apItemName:"Starting Location - Sapienza - ICA Safe House",unlockableId:"STARTING_LOCATION_SAPIENZA_APARTMENT"},
"141":{apItemName:"Hidden Stash - Hokkaido - Operating Theater Restroom",unlockableId:"AGENCYPICKUP_HOKKAIDO_SNOWCRANE_OPERATIONTOILET"},
"142":{apItemName:"Hidden Stash - Hokkaido - Restaurant Restroom",unlockableId:"AGENCYPICKUP_HOKKAIDO_SNOWCRANE_RESTAURANTRESTROOM"},
"143":{apItemName:"Agency Pickup - Hokkaido - Mountain Path",unlockableId:"AGENCYPICKUP_HOKKAIDO_SNOWCRANE_MOUNTAINPATH"},
"144":{apItemName:"Agency Pickup - Hokkaido - Kitchen Food Storage",unlockableId:"AGENCYPICKUP_HOKKAIDO_SNOWCRANE_KITCHEN"},
"145":{apItemName:"Agency Pickup - Hokkaido - Garage",unlockableId:"AGENCYPICKUP_HOKKAIDO_SNOWCRANE_GARAGE"},
"146":{apItemName:"Agency Pickup - Hokkaido - Morgue Storage",unlockableId:"AGENCYPICKUP_HOKKAIDO_SNOWCRANE_MORGUE"},
"147":{apItemName:"Hidden Stash - Hokkaido - Staff Wardrobe",unlockableId:"AGENCYPICKUP_HOKKAIDO_SNOWCRANE_SLEEPINGQUARTERS"},
"148":{apItemName:"Agency Pickup - Colorado - Red Barn",unlockableId:"AGENCYPICKUP_COLORADO_BULL_RED_BARN"},
"149":{apItemName:"Agency Pickup - Colorado - Water Tower",unlockableId:"AGENCYPICKUP_COLORADO_WATERTOWER"},
"150":{apItemName:"Agency Pickup - Colorado - West Bridge",unlockableId:"AGENCYPICKUP_COLORADO_WESTBRIDGE"},
"151":{apItemName:"Hidden Stash - Colorado - Hay Shed",unlockableId:"AGENCYPICKUP_COLORADO_HAYBARN"},
"152":{apItemName:"Hidden Stash - Colorado - Courtyard Shed",unlockableId:"AGENCYPICKUP_COLORADO_COURTYARD_OUTHOUSE"},
"153":{apItemName:"Hidden Stash - Colorado - Ground Floor Laundry Room",unlockableId:"AGENCYPICKUP_COLORADO_BULL_HOUSE_LAUNDRYROOM"},
"154":{apItemName:"Hidden Stash - Colorado - Orchard Road",unlockableId:"AGENCYPICKUP_COLORADO_BULL_ORCHARD_BOX"},
"155":{apItemName:"Hidden Stash - Colorado - Truck Loading Area",unlockableId:"AGENCYPICKUP_COLORADO_BULL_ORCHARD_PARKINGAREA"},
"156":{apItemName:"Agency Pickup - Bangkok - 47's Suite",unlockableId:"AGENCYPICKUP_BANGKOK_47S_SUITE"},
"157":{apItemName:"Agency Pickup - Bangkok - Storage Room",unlockableId:"AGENCYPICKUP_BANGKOK_STORAGE_ROOM"},
"158":{apItemName:"Agency Pickup - Bangkok - Garden Shed",unlockableId:"AGENCYPICKUP_BANGKOK_GARDEN_SHED"},
"159":{apItemName:"Agency Pickup - Bangkok - AGENCYPICKUP_BANGKOK_TIGER_MEDITATION",unlockableId:"AGENCYPICKUP_BANGKOK_TIGER_MEDITATION"},
"160":{apItemName:"Agency Pickup - Bangkok - North Wing Basement",unlockableId:"AGENCYPICKUP_BANGKOK_TIGER_BASEMENT_NORTHWING_A"},
"161":{apItemName:"Agency Pickup - Bangkok - South Wing Basement",unlockableId:"AGENCYPICKUP_BANGKOK_TIGER_BASEMENT_SOUTHWING_B"},
"162":{apItemName:"Agency Pickup - Bangkok - Penthouse",unlockableId:"AGENCYPICKUP_BANGKOK_TIGER_PENTHOUSE"},
"163":{apItemName:"Agency Pickup - Bangkok - Recording Studio",unlockableId:"AGENCYPICKUP_BANGKOK_TIGER_STUDIO"},
"164":{apItemName:"Hidden Stash - Bangkok - 1st Floor South Wing Balcony",unlockableId:"AGENCYPICKUP_BANGKOK_TIGER_BALCONY_PLANTER"},
"165":{apItemName:"Hidden Stash - Bangkok - Ground Floor Restaurant Restroom",unlockableId:"AGENCYPICKUP_BANGKOK_TIGER_RESTAURANT_TOILET"},
"166":{apItemName:"Hidden Stash - Bangkok - Room 102 Bathroom",unlockableId:"AGENCYPICKUP_BANGKOK_TIGER_BATHROOM_TOWELS"},
"167":{apItemName:"Agency Pickup - Marrakesh - West Bazaar Rooftops",unlockableId:"AGENCYPICKUP_MARRAKESH_SNIPER_ROOF"},
"168":{apItemName:"Agency Pickup - Marrakesh - Old Headmaster's Terrace",unlockableId:"AGENCYPICKUP_MARRAKESH_HEADMASTER"},
"169":{apItemName:"Agency Pickup - Marrakesh - Lamp Shop Alley",unlockableId:"AGENCYPICKUP_MARRAKESH_LAMPSHOP_ALLEY_DEFAULT"},
"170":{apItemName:"Hidden Stash - Marrakesh - Carpet Shop",unlockableId:"AGENCYPICKUP_MARRAKESH_BAZAAR_CARPETSHOP"},
"171":{apItemName:"Hidden Stash - Marrakesh - Shisha Café Restroom",unlockableId:"AGENCYPICKUP_MARRAKESH_CAFE_RESTROOM"},
"172":{apItemName:"Hidden Stash - Marrakesh - Mechanic Shop",unlockableId:"AGENCYPICKUP_MARRAKESH_MECHANIC_SHOP"},
"173":{apItemName:"Agency Pickup - Marrakesh - Consulate Parking Garage",unlockableId:"AGENCYPICKUP_MARRAKESH_SPIDER_CONSULATE_BASEMENT"},
"174":{apItemName:"Agency Pickup - Marrakesh - School Gate",unlockableId:"AGENCYPICKUP_MARRAKESH_SPIDER_SCHOOL_BACKENTRANCE"},
"175":{apItemName:"Hidden Stash - Marrakesh - Consulate Top Floor",unlockableId:"AGENCYPICKUP_MARRAKESH_SPIDER_CONSULATE_TROLLEY"},
"176":{apItemName:"Agency Pickup - Paris - Basement Stairwell",unlockableId:"AGENCYPICKUP_PARIS_BASEMENT_CORRIDOR"},
"177":{apItemName:"Hidden Stash - Paris - AGENCYPICKUP_PARIS_OFFICE_CURTAINS",unlockableId:"AGENCYPICKUP_PARIS_OFFICE_CURTAINS"},
"178":{apItemName:"Agency Pickup - Paris - Shed",unlockableId:"AGENCYPICKUP_PARIS_BARGE"},
"179":{apItemName:"Agency Pickup - Paris - Empty Attic Room",unlockableId:"AGENCYPICKUP_PARIS_ATTIC_ROOM"},
"180":{apItemName:"Hidden Stash - Paris - Top Floor Bathroom",unlockableId:"AGENCYPICKUP_PARIS_TOILET"},
"181":{apItemName:"Hidden Stash - Paris - Pantry",unlockableId:"AGENCYPICKUP_PARIS_PEACOCK_PANTRY"},
"182":{apItemName:"Hidden Stash - Paris - First Floor Apartments",unlockableId:"AGENCYPICKUP_PARIS_PEACOCK_NEWSPAPERS"},
"183":{apItemName:"Agency Pickup - Paris - Logistics Trailer",unlockableId:"AGENCYPICKUP_PARIS_PEACOCK_LOGISTICS_TRAILER"},
"184":{apItemName:"Agency Pickup - Sapienza - Ether Field Lab",unlockableId:"AGENCYPICKUP_SAPIENZA_OCTOPUS_BIOLAB"},
"185":{apItemName:"Hidden Stash - Sapienza - Mansion Pantry",unlockableId:"AGENCYPICKUP_SAPIENZA_OCTOPUS_KITCHENPANTRY"},
"186":{apItemName:"Hidden Stash - Sapienza - Mansion Garage",unlockableId:"AGENCYPICKUP_SAPIENZA_OCTOPUS_MANSIONGARAGE"},
"187":{apItemName:"Agency Pickup - Sapienza - Via Valle del Sole 9",unlockableId:"AGENCYPICKUP_SAPIENZA_ABANDONEDSHOP"},
"188":{apItemName:"Agency Pickup - Sapienza - ICA Safe House",unlockableId:"AGENCYPICKUP_SAPIENZA_APARTMENT"},
"189":{apItemName:"Agency Pickup - Sapienza - Café Basement",unlockableId:"AGENCYPICKUP_SAPIENZA_CAFEBASEMENT"},
"190":{apItemName:"Hidden Stash - Sapienza - Confessional Booth",unlockableId:"AGENCYPICKUP_SAPIENZA_CHURCHCONFESSIONAL"},
"191":{apItemName:"Agency Pickup - Sapienza - Sapienza Ruins",unlockableId:"AGENCYPICKUP_SAPIENZA_RUINSTOWER"},
"192":{apItemName:"Agency Pickup - Sapienza - Sewers",unlockableId:"AGENCYPICKUP_SAPIENZA_SEWERS"},
"193":{apItemName:"Melee - Fiber Wire",unlockableId:"TOKEN_FIBERWIRE"},
"194":{apItemName:"Melee - Fiber  Wire Classic",unlockableId:"PROP_MELEE_CLASSIC_FIBER_WIRE"},
"195":{apItemName:"Melee - Earphones",unlockableId:"PROP_MELEE_PHONE_CORD"},
"196":{apItemName:"Melee - IO Elite S2VP Earphones",unlockableId:"PROP_MELEE_BLACK_PHONE_CORD"},
"197":{apItemName:"Melee - The Straitjacket Belt",unlockableId:"PROP_MELEE_LEATHERBELT_ASYLUM"},
"198":{apItemName:"Melee - Quickdraw",unlockableId:"PROP_MELEE_QUICKDRAW"},
"199":{apItemName:"Melee - Fishing Line",unlockableId:"PROP_MELEE_FISHING_LINE"},
"200":{apItemName:"Melee - Measuring Tape",unlockableId:"PROP_MELEE_MEASURING_TAPE"},
"201":{apItemName:"Melee - Combat Knife",unlockableId:"PROP_MELEE_COMBAT_KNIFE"},
"202":{apItemName:"Melee - Antique Carved Knife",unlockableId:"PROP_MELEE_ANTIQUE_KNIFE_CURVED"},
"203":{apItemName:"Melee - Hobby Knife",unlockableId:"PROP_MELEE_HOBBY_KNIFE"},
"204":{apItemName:"Tool - ICA Titanium Crowbar",unlockableId:"PROP_TOOL_BURGLARCROWBAR"},
"205":{apItemName:"Melee - Piton",unlockableId:"PROP_MELEE_PITON"},
"206":{apItemName:"Melee - Walking Cane",unlockableId:"PROP_MELEE_CANE"},
"207":{apItemName:"Melee - The Devil's Cane",unlockableId:"PROP_MELEE_CANE_GREED"},
"208":{apItemName:"Melee - Shuriken",unlockableId:"PROP_MELEE_SHURIKEN"},
"209":{apItemName:"Melee - Bat Shuriken",unlockableId:"PROP_MELEE_SHURIKEN_BAT"},
"210":{apItemName:"Melee - The Club Boom 12\" Vinyl Sampler",unlockableId:"PROP_MELEE_SHURIKEN_LP_TOMORROWLAND"},
"211":{apItemName:"Melee - Concealable Knife",unlockableId:"PROP_MELEE_HIDDEN_BLADE"},
"212":{apItemName:"Melee - HF Championship Bat",unlockableId:"PROP_MELEE_JAPANESE_BASEBALLBAT"},
"213":{apItemName:"Melee - The Purple Streak Baseball Bat",unlockableId:"PROP_MELEE_BASEBALLBAT_PURPLE"},
"214":{apItemName:"Melee - Nne Obara's Machete",unlockableId:"PROP_MELEE_MACHETE_BLOODY"},
"215":{apItemName:"Melee - Kukri Machette",unlockableId:"PROP_MELEE_MACHETE_JUNGLE"},
"216":{apItemName:"Melee - Jarl's Pirate Saber",unlockableId:"PROP_MELEE_PIRATE_SABRE"},
"217":{apItemName:"Melee - The Proud Swashbuckler",unlockableId:"PROP_MELEE_PRIDE_SABER"},
"218":{apItemName:"Melee - Okinawan Tonfa",unlockableId:"PROP_MELEE_NINJATONFA"},
"219":{apItemName:"Melee - Feather Duster",unlockableId:"PROP_MELEE_FEATHER_DUSTER"},
"220":{apItemName:"Melee - Masamune",unlockableId:"PROP_MELEE_KATANA_ENGRAVED"},
"221":{apItemName:"Melee - White Katana",unlockableId:"PROP_MELEE_KATANA_WHITE_NINJA"},
"222":{apItemName:"Melee - Concealable Baton",unlockableId:"PROP_MELEE_EXPANDABLE_BATON"},
"223":{apItemName:"Melee - Janbiya",unlockableId:"PROP_MELEE_CEREMONIAL_DAGGER"},
"224":{apItemName:"Melee - Eiffel Tower Souvenir",unlockableId:"PROP_MELEE_EIFFELSOUVENIR_CLUB"},
"225":{apItemName:"Melee - Crystal Ball",unlockableId:"PROP_MELEE_CRYSTALBALL"},
"226":{apItemName:"Melee - Burj Al-Ghazali Snowglobe",unlockableId:"PROP_MELEE_SHOWGLOBE"},
"227":{apItemName:"Melee - Claw Hammer",unlockableId:"PROP_MELEE_MODERN_HAMMER"},
"228":{apItemName:"Pistol - HWK21",unlockableId:"FIREARMS_HERO_PISTOL_HWK_21"},
"229":{apItemName:"Shotgun - Enram HV",unlockableId:"FIREARMS_HERO_SHOTGUN_SEMIAUTO_ENRAM_HV"},
"230":{apItemName:"Assault Rifle - TAC-4 AR Desert",unlockableId:"FIREARMS_HERO_RIFLE_FULLAUTO_016_SU_SKIN06"},
"231":{apItemName:"Pistol - ICA19",unlockableId:"FIREARMS_HERO_PISTOL_TACTICAL_ICA_19"},
"232":{apItemName:"Pistol - ICA19 Black Lilly",unlockableId:"FIREARMS_HERO_PISTOL_TACTICAL_ICA_19_BLACK_LILLY"},
"233":{apItemName:"Assault Rifle - TAC-4 AR Auto",unlockableId:"FIREARMS_HERO_RIFLE_FULLAUTO_TAC_4_AUTO"},
"234":{apItemName:"SMG - TAC-SMG",unlockableId:"FIREARMS_HERO_SMG_TAC_SMG"},
"235":{apItemName:"Assault Rifle - TAC-4 S/A Jungle",unlockableId:"FIREARMS_HERO_RIFLE_SEMIAUTO_011_SU_SKIN10"},
"236":{apItemName:"Pistol - ICA19 Chrome",unlockableId:"FIREARMS_HERO_PISTOL_TACTICAL_015_SU_SKIN05"},
"237":{apItemName:"Pistol - ICA19 Silverballer",unlockableId:"FIREARMS_HERO_PISTOL_TACTICAL_SILVERBALLER"},
"238":{apItemName:"Pistol - HWK21 Pale Homemade Silencer",unlockableId:"FIREARMS_HERO_PISTOL_SILENCED_HOMEMADE"},
"239":{apItemName:"Pistol - Custom 5mm",unlockableId:"FIREARMS_HERO_PISTOL_CUSTOM5MM"},
"240":{apItemName:"Pistol - ICA19 F/A",unlockableId:"FIREARMS_HERO_PISTOL_TACTICAL_ICA_19_FA"},
"241":{apItemName:"Pistol - HWK21 Covert",unlockableId:"FIREARMS_HERO_PISTOL_LIGHT_HWK_21_COVERT"},
"242":{apItemName:"Pistol - ICA19 Shortballer",unlockableId:"FIREARMS_HERO_PISTOL_SHORT_BALLER"},
"243":{apItemName:"SMG - TAC-SMG S",unlockableId:"FIREARMS_HERO_SMG_TACTICAL_TAC_SMG_S"},
"244":{apItemName:"Assault Rifle - TAC-4 AR Stealth",unlockableId:"FIREARMS_HERO_RIFLE_FULLAUTO_TAC_4_AR_STEALTH"},
"245":{apItemName:"Shotgun - Enram HV CM",unlockableId:"FIREARMS_HERO_SHOTGUN_SEMIAUTO_ENRAM_HV_CM"},
"246":{apItemName:"SMG - TAC-SMG Covert",unlockableId:"FIREARMS_HERO_SMG_TACTICAL_012_ST_AIM_SU_SKIN03"},
"247":{apItemName:"Sniper - Jaeger 7 Lancer",unlockableId:"FIREARMS_HERO_SNIPER_HEAVY_JAEAGER_LANCER"},
"248":{apItemName:"Assault Rifle - RS-15",unlockableId:"FIREARMS_HERO_RIFLE_FULLAUTO_RS_15"},
"249":{apItemName:"Assault Rifle - TAC-4 S/A",unlockableId:"FIREARMS_HERO_RIFLE_SEMIAUTO_TAC_4_SA_STEALTH"},
"250":{apItemName:"Sniper - Sieger 300",unlockableId:"FIREARMS_HERO_SNIPER_MEDIUM_SIEGER_300"},
"251":{apItemName:"Sniper - Siger 300 Viper",unlockableId:"FIREARMS_SNIPER_MEDIUM_SIEGER_300_VIPER"},
"252":{apItemName:"Shotgun - ENRAM HV Covert",unlockableId:"FIREARMS_HERO_SHOTGUN_SEMIAUTO_ENRAM_HV_COVERT"},
"253":{apItemName:"Sniper - Jaeger 7 Tiger",unlockableId:"FIREARMS_HERO_SNIPER_HEAVY_JAEGER_TIGER"},
"254":{apItemName:"Pistol - Krugermeier 2-2",unlockableId:"FIREARMS_HERO_PISTOL_KRUGERMEIER"},
"255":{apItemName:"Pistol - Krugermeier 2-2 Silver",unlockableId:"FIREARMS_HERO_PISTOL_KRUGERMEIER_SILVER"},
"256":{apItemName:"Pistol - Krugermeier 2-2 Dark",unlockableId:"FIREARMS_HERO_PISTOL_KRUGERMEIER_SPECTRE"},
"257":{apItemName:"Assault Rifle - Sieger AR552 Tactical",unlockableId:"FIREARMS_HERO_RIFLE_SIEGER_AR552_TACTICAL"},
"258":{apItemName:"Pistol - Striker V3",unlockableId:"FIREARMS_HERO_PISTOL_STRIKER_V3"},
"259":{apItemName:"Sniper - Jaeger 7",unlockableId:"FIREARMS_HERO_SNIPER_JAEGER"},
"260":{apItemName:"Sniper - Jaeger 7 MKII",unlockableId:"FIREARMS_HERO_SNIPER_JAEGER_S2"},
"261":{apItemName:"Explosive - The Pale Duck",unlockableId:"PROP_DEVICE_SONYPREORDER_WHITE_RUBBERDUCK_REMOTE_EXPLOSIVE"},
"262":{apItemName:"Distraction - Coin",unlockableId:"PROP_TOOL_COIN"},
"263":{apItemName:"Distraction - Classic Coin",unlockableId:"PROP_TOOL_COIN_CLASSIC"},
"264":{apItemName:"Explosive - ICA Proximity Explosive",unlockableId:"PROP_DEVICE_ICA_MODULAR_PROXIMITY_EXPLOSIVE"},
"265":{apItemName:"Explosive - The Serpent's Bite",unlockableId:"PROP_DEVICE_REMOTE_EXPLOSIVE_LUST"},
"266":{apItemName:"Explosive - The Roar Flash Grenade",unlockableId:"PROP_DEVICE_PROXIMITY_FLASH_WRATH"},
"267":{apItemName:"Poision - Modern Lethal Syringe",unlockableId:"PROP_MELEE_SYRINGE_LETHAL"},
"268":{apItemName:"Poision - Emetic Poison Vial  MK III",unlockableId:"PROP_POISON_EMETIC_VIAL_S3"},
"269":{apItemName:"Poision - \"Bubble Queen\"Gum Pack",unlockableId:"PROP_POISON_SEDATIVE_GUM_GLUTTONY"},
"270":{apItemName:"Poision - Sedative Poision Vial MK III",unlockableId:"PROP_POISON_SEDATIVE_VIAL_S3"},
"271":{apItemName:"Tool - Lockpick",unlockableId:"PROP_TOOL_LOCK_PICK"},
"272":{apItemName:"Tool - Lockpick MK II",unlockableId:"PROP_TOOL_LOCK_PICK_S2"},
"273":{apItemName:"Tool - Lockpick MK III",unlockableId:"PROP_TOOL_LOCK_PICK_S3"},
"274":{apItemName:"Tool - Classic Lockpick",unlockableId:"PROP_TOOL_LOCK_PICK_CLASSIC"},
"275":{apItemName:"Tool - Bone Lockpick",unlockableId:"PROP_TOOL_LOCK_PICK_BONE"},
"276":{apItemName:"Tool - Handyman Wrench",unlockableId:"PROP_TOOL_WRENCH_HANDYMAN"},
"277":{apItemName:"Tool - Professional Screwdriver",unlockableId:"PROP_TOOL_SCREWDRIVER_PROFESSIONAL"},
"278":{apItemName:"Distraction - ICA Remote Audio Distraction",unlockableId:"PROP_DEVICE_ICA_MODULAR_REMOTE_AUDIODISTRACTION"},
"279":{apItemName:"Distraction - \"Mixtape 47\"",unlockableId:"PROP_DEVICE_ICA_MODULAR_REMOTE_MUSICDISTRACTION"},
"280":{apItemName:"Explosive - ICA Remote Explosive",unlockableId:"PROP_DEVICE_ICA_MODULAR_REMOTE_EXPLOSIVE"},
"281":{apItemName:"Explosive - ICA Remote Explosive MK III",unlockableId:"PROP_DEVICE_ICA_MODULAR_REMOTE_EXPLOSIVE_S3"},
"282":{apItemName:"Explosive - Proximity Explosive Duck",unlockableId:"PROP_DEVICE_ICA_RUBBERDUCK_PROXIMITY_EXPLOSIVE"},
"283":{apItemName:"Explosive - Remote Explosive Classic Rubber Duck",unlockableId:"PROP_DEVICE_ICA_CLASSIC_RUBBERDUCK_PROXIMITY_EXPLOSIVE"},
"284":{apItemName:"Explosive - Remove Explosive Devil Rubber Duck",unlockableId:"PROP_DEVICE_DEVIL_RUBBERDUCK_REMOTE_EXPLOSIVE"},
"285":{apItemName:"Explosive - The Iconator",unlockableId:"PROP_DEVICE_ACTIONFIGURE_PROXIMITY_EXPLOSIVE"},
"286":{apItemName:"Explosive - ICA Proximity Explosive MK III",unlockableId:"PROP_DEVICE_ICA_PROXIMITY_EXPLOSIVE_S3"},
"287":{apItemName:"Explosive - Proximity Semtex Demo Block MK III",unlockableId:"PROP_DEVICE_ICA_SEMTEX_PROXIMITY_EXPLOSIVE_S3"},
"288":{apItemName:"Explosive - Remote Semetex Demo Block MK III",unlockableId:"PROP_DEVICE_ICA_SEMTEX_REMOTE_EXPLOSIVE_S3"},
"289":{apItemName:"Explosive - Napolen Blownaparte",unlockableId:"PROP_DEVICE_NAPOLEON_FIGURE_REMOTE_EXPLOSIVE"},
"290":{apItemName:"Explosive - Lil' Flashy",unlockableId:"PROP_DEVICE_LIL_FLASHY_REMOTE_FLASH"},
"291":{apItemName:"Explosive - Explosive Xmas Gift",unlockableId:"PROP_DEVICE_EXPLOSIVE_PRESENT"},
"292":{apItemName:"Explosive - Explosive Pen",unlockableId:"PROP_DEVICE_EXPLODING_FOUNTAIN_PEN"},
"293":{apItemName:"Explosive - The Ancestral Fountain Pen",unlockableId:"PROP_DEVICE_EXPLODING_FOUNTAIN_PEN_ANCESTRAL"},
"294":{apItemName:"Explosive - Remote Explosive Duck",unlockableId:"PROP_DEVICE_ICA_RUBBERDUCK_REMOTE_EXPLOSIVE"},
"295":{apItemName:"Explosive - Proximity Explosive Duck MK III",unlockableId:"PROP_DEVICE_ICA_RUBBERDUCK_PROXIMITY_EXPLOSIVE_S3"},
"296":{apItemName:"Explosive - Sunset Rubber Duck",unlockableId:"PROP_DEVICE_ICA_RUBBERDUCK_REMOTE_EXPLOSIVE_STA"},
"297":{apItemName:"Explosive - Proximity CX Demo Block",unlockableId:"PROP_DEVICE_ICA_C4_PROXIMITY_EXPLOSIVE"},
"298":{apItemName:"Explosive - Remote CX Demo Block",unlockableId:"PROP_DEVICE_ICA_C4_REMOTE_EXPLOSIVE"},
"299":{apItemName:"Explosive - Remote Breaching Charge",unlockableId:"PROP_DEVICE_ICA_MODULAR_REMOTE_BREACHCHARGE"},
"300":{apItemName:"Explosive - ICA Explosive Phone",unlockableId:"PROP_DEVICE_ICA_PHONE_EXPLOSIVE"},
"301":{apItemName:"Explosive - Explosive Compound",unlockableId:"PROP_EXPLOSIVE_EXPLOSIVE_COMPOUND"},
"302":{apItemName:"Explosive - Explosive Golf Ball",unlockableId:"PROP_EXPLOSIVE_GOLFBALL"},
"303":{apItemName:"Distraction - The Big One",unlockableId:"PROP_DISTRACTION_FIRECRACKER"},
"304":{apItemName:"Tool - Remote EMP Charge",unlockableId:"PROP_DEVICE_ICA_MODULAR_REMOTE_EMP"},
"305":{apItemName:"Distraction - Gold Coin",unlockableId:"PROP_TOOL_GOLD_COIN"},
"306":{apItemName:"Melee - Blueberry Muffin",unlockableId:"PROP_MELEE_MUFFIN_BLUEBERRY"},
"307":{apItemName:"Poision - Emetic Poison Vial",unlockableId:"PROP_POISON_VIAL_SICK"},
"308":{apItemName:"Poision - Sedative Poision Vial",unlockableId:"PROP_POISON_VIAL_SEDATIVE"},
"309":{apItemName:"Poision - Lethal Poison Vial MK III",unlockableId:"PROP_POISON_VIAL_LETHAL_S3"},
"310":{apItemName:"Poision - Lethal Poison Vial",unlockableId:"PROP_POISON_VIAL_FAST"},
"311":{apItemName:"Poision - Antique Emetic Syringe",unlockableId:"PROP_MELEE_ANTIQUE_SYRINGE_EMETIC"},
"312":{apItemName:"Poision - ICA Pen Syringe Emetic",unlockableId:"PROP_EMETIC_POISON_PEN_SYRINGE"},
"313":{apItemName:"Poision - Guru's Pen Syringe Emetic",unlockableId:"PROP_EMETIC_POISON_PEN_SYRINGE_GURU"},
"314":{apItemName:"Poision - Modern Sedative Syringe",unlockableId:"PROP_MELEE_SYRINGE_SEDATIVE"},
"315":{apItemName:"Poision - Antique Lethal Syringe",unlockableId:"PROP_MELEE_ANTIQUE_SYRINGE_LETHAL"},
"316":{apItemName:"Poision - Modern Emetic Syringe",unlockableId:"PROP_MELEE_SYRINGE_EMETIC"},
"317":{apItemName:"Tool - Disposable Scrambler",unlockableId:"PROP_TOOL_ELECTRICAL_KIT"},
"318":{apItemName:"Melee - Fish",unlockableId:"PROP_MELEE_FISH"},
"319":{apItemName:"Melee - Violin",unlockableId:"PROP_MELEE_VIOLIN_SMALL"},
"320":{apItemName:"Melee - Broadsword",unlockableId:"PROP_MELEE_LONG_SWORD"},
"321":{apItemName:"Melee - Ornate Scimitar",unlockableId:"PROP_MELEE_SCIMITAR"},
"322":{apItemName:"Melee - Mace",unlockableId:"PROP_MELEE_MACE"},
"323":{apItemName:"Explosive - Explosive Baseball",unlockableId:"PROP_EXPLOSIVE_BASEBALL"},
"324":{apItemName:"Melee - Small Goldbar",unlockableId:"PROP_TOOL_GOLD_BAR_SMALL"},
"325":{apItemName:"Explosive - Magnesium Pouch",unlockableId:"PROP_EXPLOSIVE_MAGNESIUM_POWDER"},
"326":{apItemName:"Explosive - Shaman Powder",unlockableId:"PROP_EXPLOSIVE_SHAMAN_POWDER"},
"327":{apItemName:"Tool - ICA Proximity Taser",unlockableId:"PROP_DEVICE_ICA_PROXIMITY_TASER"},
"328":{apItemName:"Tool - ICA Remote Taser",unlockableId:"PROP_DEVICE_ICA_REMOTE_TASER"},
"329":{apItemName:"Tool - ICA Remote Micro Taser",unlockableId:"PROP_DEVICE_ICA_REMOTE_MICROTASER_S3"},
"330":{apItemName:"Tool - Remote Emetic Gas Device",unlockableId:"PROP_DEVICE_ICA_REMOTE_GAS_EMETIC"},
"331":{apItemName:"Tool - ICA Flash Phone",unlockableId:"PROP_DEVICE_ICA_REMOTE_FLASH_PHONE"},
"332":{apItemName:"Explosive - ICA Proximity Concussion Device",unlockableId:"PROP_DEVICE_PROXIMITY_CONCUSSION"},
"333":{apItemName:"Explosive - ICA Proximity Concussion Device MK III",unlockableId:"PROP_DEVICE_PROXIMITY_CONCUSSION_S3"},
"334":{apItemName:"Explosive - ICA Remote Concussion Device",unlockableId:"PROP_DEVICE_REMOTE_CONCUSSION"},
"335":{apItemName:"Explosive - Remote Concussion Rubber Duck",unlockableId:"PROP_DEVICE_REMOTE_RUBBERDUCK_CONCUSSION"},
"336":{apItemName:"Explosive - Goldbrick Proximity Mine",unlockableId:"PROP_DEVICE_AUDIO_SEDATIVE_MINE_SLOTH"},
"337":{apItemName:"Explosive - Remote Concussion Collectors Duck",unlockableId:"PROP_DEVICE_REMOTE_RUBBERDUCK_CONCUSSION_COLLECTORS"},
"338":{apItemName:"Explosive - Concussion Grenade",unlockableId:"PROP_EXPLOSIVE_GRENADE_CONCUSSION"},
"339":{apItemName:"Explosive - Nitroglycerin",unlockableId:"PROP_EXPLOSIVE_NITROGLYCERINE"},
"340":{apItemName:"Explosive - Molotov Cocktail",unlockableId:"PROP_EXPLOSIVE_GRENADE_MOLOTOV"},
"341":{apItemName:"Tool - Emetic Grenade",unlockableId:"PROP_GAS_GRENADE_EMETIC"},
"342":{apItemName:"Tool - Emetic Gas Grenade",unlockableId:"PROP_GAS_GRENADE_EMETIC_FROG"},
"343":{apItemName:"Tool - Guru's Emetic Grenade",unlockableId:"PROP_GAS_GRENADE_EMETIC_GURU"},
"344":{apItemName:"Explosive - Flash Grenade",unlockableId:"PROP_EXPLOSIVE_GRENADE_FLASH"},
"345":{apItemName:"Explosive - Flash Grenade MK III",unlockableId:"PROP_EXPLOSIVE_GRENADE_FLASH_S3"},
"346":{apItemName:"Explosive - Fragmentation Grenade",unlockableId:"PROP_EXPLOSIVE_GRENADE_FRAG"},
"347":{apItemName:"Explosive - The Red Light Flash Grenade",unlockableId:"PROP_EXPLOSIVE_GRENADE_FLASH_TOMORROWLAND"},
"348":{apItemName:"Explosive - ICA Proximity Micro Explosive",unlockableId:"PROP_DEVICE_ICA_MICRO_PROXIMITY_EXPLOSIVE"},
"349":{apItemName:"Explosive - ICA Tripwire Mine",unlockableId:"PROP_DEVICE_ICA_TRIPWIRE_EXPLOSIVE"},
"350":{apItemName:"Explosive - ICA Micro Remote Explosive",unlockableId:"PROP_DEVICE_ICA_MICRO_REMOTE_EXPLOSIVE"},
"351":{apItemName:"Explosive - ICA Remote Flash Device",unlockableId:"PROP_DEVICE_ICA_REMOTE_FLASH"},
"352":{apItemName:"Explosive - Proximity CX Demo Block MK II",unlockableId:"PROP_DEVICE_ICA_PROXIMITY_SEMTEX_BLOCK"},
"353":{apItemName:"Explosive - Remote CX Demo Block MK II",unlockableId:"PROP_DEVICE_ICA_REMOTE_SEMTEX_BLOCK"},
"354":{apItemName:"Explosive - ICA Remote Explosive MK II",unlockableId:"PROP_DEVICE_ICA_MODULAR_REMOTE_EXPLOSIVE_S2"},
"355":{apItemName:"Explosive - ICA Proximity Explosive MK II",unlockableId:"PROP_DEVICE_ICA_MODULAR_PROXIMITY_EXPLOSIVE_S2"},
"356":{apItemName:"Explosive - Proximity Explosive Rubber Duck MK II",unlockableId:"PROP_DEVICE_ICA_RUBBER_DUCK_PROXIMITY_EXPLOSIVE_S2"},
"357":{apItemName:"Explosive - Remote Explosive Rubber Duck MK II",unlockableId:"PROP_DEVICE_ICA_RUBBER_DUCK_REMOTE_EXPLOSIVE_S2"},
"358":{apItemName:"Poision - Emetic Syringe Mk II",unlockableId:"PROP_MELEE_SYRINGE_EMETIC_S2"},
"359":{apItemName:"Poision - Lethal Syringe Mk II",unlockableId:"PROP_MELEE_SYRINGE_LETHAL_S2"},
"360":{apItemName:"Poision - Lethal Syringe Mk III",unlockableId:"PROP_MELEE_SYRINGE_LETHAL_S3"},
"361":{apItemName:"Distraction - ICA Remote Audio Distraction MKII",unlockableId:"PROP_DEVICE_ICA_REMOTE_AUDIO_DISTRACTION_S2"},
"362":{apItemName:"Distraction - ICA Remote Audio Distraction MKIII",unlockableId:"PROP_DEVICE_ICA_REMOTE_AUDIO_DISTRACTION_S3"},
"363":{apItemName:"Tool - Electronic Key Hacker",unlockableId:"PROP_DEVICE_KEYCARD_HACKER_S2"},
"364":{apItemName:"Tool - Electronic Key Hacker MK III",unlockableId:"PROP_DEVICE_KEYCARD_HACKER_S3"},
"365":{apItemName:"Explosive - Breaching Charge MK II",unlockableId:"PROP_DEVICE_ICA_MODULAR_REMOTE_BREACHCHARGE_S2"},
"366":{apItemName:"Explosive - Breaching Charge MK III",unlockableId:"PROP_DEVICE_ICA_MODULAR_BREACHCHARGE_S3"},
"367":{apItemName:"Distraction - ICA Remote Micro Audio Distraction",unlockableId:"PROP_DEVICE_ICA_MICRO_AUDIO_DISTRACTION"},
"368":{apItemName:"Sniper - Jaeger 7 Tuatara",unlockableId:"FIREARMS_SNIPER_JAEGER_7_TUATARA"},
"369":{apItemName:"Sniper - Jaeger 7 Green Eye",unlockableId:"FIREARMS_SNIPER_JAEGER_7_TUATARA_ENVY"},
"370":{apItemName:"Sniper - Druzhina 34 ICA Arctic",unlockableId:"FIREARMS_SNIPER_DRUZHINA_34_ARCTIC"},
"371":{apItemName:"Sniper - Druzhina 34 DTI",unlockableId:"FIREARMS_SNIPER_DRUZHINA_34_DTI"},
"372":{apItemName:"Sniper - Sieger 300 Tactical",unlockableId:"FIREARMS_SNIPER_SIEGER_300_TACTICAL"},
"373":{apItemName:"Sniper - Druzhina 34",unlockableId:"FIREARMS_SNIPER_DRUZHINA_34"},
"374":{apItemName:"Sniper - The Golden Dragon",unlockableId:"FIREARMS_SNIPER_CHINESE_DRAGON"},
"375":{apItemName:"Sniper - The Majestic",unlockableId:"FIREARMS_SNIPER_PRIDE"},
"376":{apItemName:"Assault Rifle - Shashka A33 H",unlockableId:"FIREARMS_HERO_RIFLE_AK47_HEROVERSION"},
"377":{apItemName:"Assault Rifle - The Shashka Beast",unlockableId:"FIREARMS_HERO_RIFLE_SHASKA_A33_WRATH"},
"378":{apItemName:"Assault Rifle - Shashka A33 Gold",unlockableId:"FIREARMS_HERO_RIFLE_SHASKA_A33_GOLD"},
"379":{apItemName:"Sniper - Bartoli Woodsman Hunting Rifle",unlockableId:"FIREARMS_HERO_SNIPER_WOODSMAN"},
"380":{apItemName:"Assault Rifle - TAC-4 AR MKII",unlockableId:"FIREARMS_HERO_RIFLE_TAC_4_AR_AUTO_S2"},
"381":{apItemName:"Shotgun - Bartoli 12G Short H",unlockableId:"FIREARMS_HERO_SHOTGUN_BARTOLI_12G_HEROVERSION"},
"382":{apItemName:"Shotgun - Bartoli Hunting Shotgun Deluxe",unlockableId:"HUNTING_SHOTGUN_REWARD_DELUXE"},
"383":{apItemName:"Shotgun - ICA Tactical Shotgun",unlockableId:"FIREARMS_SHOTGUN_SEMIAUTO_ICA_12G_SHORT"},
"384":{apItemName:"Shotgun - Sawed-Off Bartoli 12G",unlockableId:"FIREARMS_HERO_SHOTGUN_BARTOLI_12G_SAWED_OFF"},
"385":{apItemName:"Shotgun - The Maximalist Shotgun",unlockableId:"FIREARMS_HERO_SHOTGUN_SAWED_OFF_GLUTTONY"},
"386":{apItemName:"Shotgun - ICA Tactical Shotgun Covert",unlockableId:"FIREARMS_HERO_SHOTGUN_SILENCED"},
"387":{apItemName:"Shotgun - ICA Tactical White Shotgun Covert",unlockableId:"FIREARMS_HERO_SHOTGUN_SILENCED_WOLVERINE"},
"388":{apItemName:"Pistol - \"Rude Ruby\"",unlockableId:"FIREARMS_PISTOL_RUDE_RUBY"},
"389":{apItemName:"SMG - SMG Raptor Rude Ruby Covert",unlockableId:"FIREARMS_SMG_RUDE_RUBY"},
"390":{apItemName:"Sniper - The White Ruby Rude 300 Sniper Rifle",unlockableId:"FIREARMS_SNIPER_RIFLE_RUDE_RUBY"},
"391":{apItemName:"Melee - The Iridescent Katana",unlockableId:"PROP_MELEE_KATANA_NEON"},
"392":{apItemName:"Pistol - Kalmer 1 - Tranquilizer",unlockableId:"FIREARMS_PISTOL_DARTGUN_SEDATIVE"},
"393":{apItemName:"Pistol - Sieker 1",unlockableId:"FIREARMS_PISTOL_DARTGUN_SICK"},
"394":{apItemName:"Pistol - The Serpent's Tounge",unlockableId:"FIREARMS_PISTOL_DARTGUN_BLINDING_LUST"},
"395":{apItemName:"Pistol - Kalmer 2 - Tranquilizer",unlockableId:"FIREARMS_PISTOL_DARTGUN_SEDATIVE_KALMER_2"},
"396":{apItemName:"Pistol - The Taunton Dart Gun",unlockableId:"FIREARMS_PISTOL_DARTGUN_SEDATIVE_ASYLUM"},
"397":{apItemName:"Pistol - FIREARMS_PISTOL_DARTGUN",unlockableId:"FIREARMS_PISTOL_DARTGUN"},
"398":{apItemName:"Pistol - ICA19 Silverballer MK II",unlockableId:"FIREARMS_PISTOL_SILVERBALLER_S2"},
"399":{apItemName:"Pistol - ICA19 Classicballer",unlockableId:"FIREARMS_PISTOL_CLASSIC_SILVERBALLER"},
"400":{apItemName:"Pistol - ICA19 White Trinity",unlockableId:"FIREARMS_PISTOL_LIFE_BALLER"},
"401":{apItemName:"Pistol - ICA19 Black Trinity",unlockableId:"FIREARMS_PISTOL_DEATH_BALLER"},
"402":{apItemName:"Pistol - ICA19 White Trinity",unlockableId:"FIREARMS_PISTOL_BIRTH_BALLER"},
"403":{apItemName:"Pistol - ICA19 Goldballer",unlockableId:"FIREARMS_PISTOL_GOLD_BALLER"},
"404":{apItemName:"Pistol - Concept 5",unlockableId:"FIREARMS_PISTOL_CONCEPT_5"},
"405":{apItemName:"Pistol - HWK21 MK II",unlockableId:"FIREARMS_PISTOL_HWK_21_S2"},
"406":{apItemName:"SMG - DAK X2 Covert Special",unlockableId:"FIREARMS_HERO_SMG_MAC10_COVERT"},
"407":{apItemName:"SMG - Slapdash SMG",unlockableId:"FIREARMS_HERO_SMG_DAKX2_COVERT_SLOTH"},
"408":{apItemName:"SMG - TAC-SMAG MKII",unlockableId:"FIREARMS_HERO_SMG_TAC_SMG_S2"},
"409":{apItemName:"SMG - DAK Black Covert",unlockableId:"FIREARMS_SMG_TACTICAL_DAK_DTI_BLACK_COVERT"},
"410":{apItemName:"SMG - DAK Gold Covert",unlockableId:"FIREARMS_SMG_TACTICAL_DAK_DTI_GOLD_COVERT"},
"411":{apItemName:"SMG - ICA SMG Raptor Covert",unlockableId:"FIREARMS_SMG_ICA_RAPTOR_COVERT"},
"412":{apItemName:"SMG - Malitia-Issued HX-10 SMG",unlockableId:"FIREARMS_SMG_HX10_MILITIA"},
"413":{apItemName:"SMG - Brine-Damaged SMG",unlockableId:"FIREARMS_SMG_DAK_X2_RUSTY"},
"414":{apItemName:"Shotgun - Enram HV Covert MKII",unlockableId:"FIREARMS_HERO_SHOTGUN_ENRAM_HV_COVERT_S2"},
"415":{apItemName:"Pistol - \"El Matador\"",unlockableId:"FIREARMS_HERO_PISTOL_EL_MATADOR"},
"416":{apItemName:"Poision - Sedative Pills",unlockableId:"PROP_POISON_PILLS_SEDATIVE"},
"417":{apItemName:"Poision - Emetic Pills",unlockableId:"PROP_POISON_PILLS_EMETIC"},
"418":{apItemName:"Poision - Lethal Pills",unlockableId:"PROP_POISON_PILLS_LETHAL"},
"419":{apItemName:"Poision - Lethal Pills MK III",unlockableId:"PROP_POISON_CLASSIC_PILLS_LETHAL"},
"420":{apItemName:"Sniper - Jaeger 7 Covert",unlockableId:"FIREARMS_HERO_SNIPER_HEAVY_009_SU_SUB_SCOUT_SKIN03"},
"421":{apItemName:"Sniper - Sieger 300 Advanced",unlockableId:"FIREARMS_HERO_SNIPER_MEDIUM_SIEGER_300_ADVANCED"},
"422":{apItemName:"Pistol - ICA19 F/A Stealth",unlockableId:"FIREARMS_HERO_PISTOL_TACTICAL_ICA_19_FA_STEALTH"},
"423":{apItemName:"Pistol - ICA19 F/A Stealth \"Ducky\" Edition",unlockableId:"FIREARMS_HERO_PISTOL_TACTICAL_ICA_19_FA_STEALTH_DUCKY"},
"424":{apItemName:"Pistol - The Floral Baller",unlockableId:"FIREARMS_HERO_PISTOL_FLOWERBALLER"},
"425":{apItemName:"Pistol - ICA19 Iceballer",unlockableId:"FIREARMS_HERO_PISTOL_ICEBALLER"},
"426":{apItemName:"Pistol - ICA DTI Stealth",unlockableId:"FIREARMS_PISTOL_ICA_STEALTH_DTI"},
"427":{apItemName:"Pistol - Striker",unlockableId:"FIREARMS_PISTOL_STRIKER"},
"428":{apItemName:"Pistol - Custom 5mm DTI",unlockableId:"FIREARMS_PISTOL_CUSTOM_5MM_DTI"},
"429":{apItemName:"Melee - A New Bat",unlockableId:"PROP_MELEE_A_NEW_BAT"},
"430":{apItemName:"Melee - Meaty Bone",unlockableId:"PROP_MELEE_MEAT_ITEM"},
"431":{apItemName:"Melee - Sacrificial Knife",unlockableId:"PROP_MELEE_SACRIFICIAL_KNIFE"},
"432":{apItemName:"Melee - The Black Almond's Dagger",unlockableId:"PROP_MELEE_TREASURE_KNIFE"},
"433":{apItemName:"Melee - Kukri Knife",unlockableId:"PROP_MELEE_KUKRI_KNIFE"},
"434":{apItemName:"Melee - The Cat's Claw",unlockableId:"PROP_MELEE_DAGGER_ENVY"},
"435":{apItemName:"Melee - Tanto",unlockableId:"PROP_MELEE_TANTO"},
"436":{apItemName:"Melee - Ice Pick",unlockableId:"PROP_MELEE_ICE_PICK"},
"437":{apItemName:"Melee - Ice Axe",unlockableId:"PROP_MELEE_ICE_AXE"},
"438":{apItemName:"Melee - ICA combat axe",unlockableId:"PROP_MELEE_AXE_ICA"},
"439":{apItemName:"Melee - Butcher's Saw",unlockableId:"PROP_MELEE_BUTCHERS_SAW"},
"440":{apItemName:"Melee - Meat Hook",unlockableId:"PROP_MELEE_BUTCHERS_MEATHOOK"},
"441":{apItemName:"Melee - Hook",unlockableId:"PROP_MELEE_DUGONG_GRIPHOOK"},
"442":{apItemName:"Melee - Snowball",unlockableId:"PROP_MELEE_SNOWBALL"},
"443":{apItemName:"Melee - Banana",unlockableId:"PROP_MELEE_BANANA"},
"444":{apItemName:"Sniper - Sieger 300 Ghost",unlockableId:"FIREARMS_SNIPER_SIEGER_300_GHOST"},
"445":{apItemName:"Sniper - Sieger 300 Arctic",unlockableId:"FIREARMS_SNIPER_SIEGER_300_WHITE_NINJA"},
"446":{apItemName:"Sniper - Hackl Leviathan Sniper Rifle Covert",unlockableId:"FIREARMS_SNIPER_ICA_HACKL_LEVIATHAN_COVERT"},
"447":{apItemName:"Sniper - Hackl Sniper Riffle Covert \"Ducky\" Edition",unlockableId:"FIREARMS_SNIPER_ICA_HACKL_LEVIATHAN_COVERT_DUCKY"},
"448":{apItemName:"Pistol - The Ducky Gun",unlockableId:"FIREARMS_PISTOL_CUSTOM_5MM_DUCKY"},
"449":{apItemName:"Sniper - ICA Bartoli Woodsman Hunting Rifle Covert",unlockableId:"FIREARMS_SNIPER_HEAVY_ICA_WOODSMAN_COVERT"},
"450":{apItemName:"Agency Pickup - Hawkes Bay - Beach Shack",unlockableId:"AGENCYPICKUP_NEWZEALAND_LARGE"},
"451":{apItemName:"Hidden Stash - Hawkes Bay - Garbage Container",unlockableId:"AGENCYPICKUP_NEWZEALAND_SMALL"},
"452":{apItemName:"Agency Pickup - Miami - Pit Building Locker Room",unlockableId:"AGENCYPICKUP_MIAMI_LARGE_PITBUILDING_BASEMENT"},
"453":{apItemName:"Agency Pickup - Miami - Bayside Center Car Park",unlockableId:"AGENCYPICKUP_MIAMI_LARGE_UNDERGROUND_STORAGE"},
"454":{apItemName:"Agency Pickup - Miami - Kronstadt Storage Area",unlockableId:"AGENCYPICKUP_MIAMI_LARGE_STORAGE_CONTAINER"},
"455":{apItemName:"Agency Pickup - Miami - Thwack Paddock",unlockableId:"AGENCYPICKUP_MIAMI_LARGE_STORAGE_PADDOCK"},
"456":{apItemName:"Agency Pickup - Miami - Backstage Truck",unlockableId:"AGENCYPICKUP_MIAMI_LARGE_TRUCK"},
"457":{apItemName:"Agency Pickup - Miami - Parkside Food Stands",unlockableId:"AGENCYPICKUP_MIAMI_LARGE_FOOD_AREA"},
"458":{apItemName:"Agency Pickup - Miami - Boat Rental Hut",unlockableId:"AGENCYPICKUP_MIAMI_LARGE_BOAT_RENTAL"},
"459":{apItemName:"Hidden Stash - Miami - Kronstadt Reception",unlockableId:"AGENCYPICKUP_MIAMI_SMALL_EXPO_RECEPTION"},
"460":{apItemName:"Hidden Stash - Miami - Podium Storage",unlockableId:"AGENCYPICKUP_MIAMI_SMALL_PODIUM"},
"461":{apItemName:"Hidden Stash - Miami - Stands Toilet",unlockableId:"AGENCYPICKUP_MIAMI_SMALL_STANDS_TOILET"},
"462":{apItemName:"Agency Pickup - Santa Fortuna - Village Contruction Building",unlockableId:"AGENCYPICKUP_COLOMBIA_LARGE_VILLAGE_CONSTRUCTIONBUILDING"},
"463":{apItemName:"Agency Pickup - Santa Fortuna - Coca Fields",unlockableId:"AGENCYPICKUP_COLOMBIA_LARGE_COCAFIELD"},
"464":{apItemName:"Agency Pickup - Santa Fortuna - Construction Site",unlockableId:"AGENCYPICKUP_COLOMBIA_LARGE_CONSTRUCTIONSITE"},
"465":{apItemName:"Agency Pickup - Santa Fortuna - Wine cellar",unlockableId:"AGENCYPICKUP_COLOMBIA_LARGE_MANSION_WINECELLAR"},
"466":{apItemName:"Hidden Stash - Santa Fortuna - Hostel",unlockableId:"AGENCYPICKUP_COLOMBIA_SMALL_HOSTEL"},
"467":{apItemName:"Hidden Stash - Santa Fortuna - Jungle",unlockableId:"AGENCYPICKUP_COLOMBIA_SMALL_JUNGLE"},
"468":{apItemName:"Hidden Stash - Santa Fortuna - Caves",unlockableId:"AGENCYPICKUP_COLOMBIA_SMALL_CAVES"},
"469":{apItemName:"Hidden Stash - Santa Fortuna - Fishing village",unlockableId:"AGENCYPICKUP_COLOMBIA_SMALL_FISHINGVILLAGE"},
"470":{apItemName:"Agency Pickup - Isle of Sgail - Cistern",unlockableId:"AGENCYPICKUP_THEISLAND_LARGE_CISTERN"},
"471":{apItemName:"Agency Pickup - Isle of Sgail - Morgue",unlockableId:"AGENCYPICKUP_THEISLAND_LARGE_CONSTANTS_BASEMENT"},
"472":{apItemName:"Agency Pickup - Isle of Sgail - Chapel",unlockableId:"AGENCYPICKUP_THEISLAND_LARGE_CHAPEL"},
"473":{apItemName:"Agency Pickup - Isle of Sgail - Hyperborean Showrooms",unlockableId:"AGENCYPICKUP_THEISLAND_LARGE_KEEP"},
"474":{apItemName:"Agency Pickup - Isle of Sgail - Gallery Stairwell",unlockableId:"AGENCYPICKUP_THEISLAND_SMALL_CONFERENCE_ROOM"},
"475":{apItemName:"Agency Pickup - Isle of Sgail - Gatehouse",unlockableId:"AGENCYPICKUP_THEISLAND_SMALL_GATEHOUSE"},
"476":{apItemName:"Agency Pickup - Isle of Sgail - Warehouse",unlockableId:"AGENCYPICKUP_THEISLAND_SMALL_ARK"},
"477":{apItemName:"Agency Pickup - Isle of Sgail - Kitchen",unlockableId:"AGENCYPICKUP_THEISLAND_SMALL_BASEMENT"},
"478":{apItemName:"Agency Pickup - Mumbai - Mumbai Laundry",unlockableId:"AGENCYPICKUP_MUMBAI_LARGE_LAUNDRY"},
"479":{apItemName:"Agency Pickup - Mumbai - Construction site",unlockableId:"AGENCYPICKUP_MUMBAI_LARGE_BARGE"},
"480":{apItemName:"Agency Pickup - Mumbai - Rooftop North",unlockableId:"AGENCYPICKUP_MUMBAI_LARGE_ROOFTOP"},
"481":{apItemName:"Agency Pickup - Mumbai - Rooftop South",unlockableId:"AGENCYPICKUP_MUMBAI_LARGE_FORGE"},
"482":{apItemName:"Agency Pickup - Mumbai - Train yard",unlockableId:"AGENCYPICKUP_MUMBAI_LARGE_TRAINYARD"},
"483":{apItemName:"Agency Pickup - Mumbai - The Hill",unlockableId:"AGENCYPICKUP_MUMBAI_LARGE_HILL"},
"484":{apItemName:"Agency Pickup - Mumbai - Train Tracks",unlockableId:"AGENCYPICKUP_MUMBAI_LARGE_TRAIN"},
"485":{apItemName:"Agency Pickup - Mumbai - Carpark",unlockableId:"AGENCYPICKUP_MUMBAI_LARGE_GARAGE"},
"486":{apItemName:"Hidden Stash - Mumbai - Channel",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_SEWER"},
"487":{apItemName:"Hidden Stash - Mumbai - Homeless Tent",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_NEST"},
"488":{apItemName:"Hidden Stash - Mumbai - Balcony Pot",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_KASHMERIAN"},
"489":{apItemName:"Hidden Stash - Mumbai - Old Tyre",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_TYRE"},
"490":{apItemName:"Hidden Stash - Mumbai - Washing Stalls",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_CLOTH"},
"491":{apItemName:"Hidden Stash - Mumbai - Beach",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_BOAT"},
"492":{apItemName:"Hidden Stash - Mumbai - Shoeshop",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_SHOESHOP"},
"493":{apItemName:"Hidden Stash - Mumbai - Slum Apartment",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_BAG"},
"494":{apItemName:"Hidden Stash - Mumbai - Meat Market",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_MEAT"},
"495":{apItemName:"Hidden Stash - Mumbai - Streets on the Hill",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_FLOWER"},
"496":{apItemName:"Hidden Stash - Mumbai - Pottery Market",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_POT"},
"497":{apItemName:"Hidden Stash - Mumbai - Rangan Tower",unlockableId:"AGENCYPICKUP_MUMBAI_SMALL_APARTMENT"},
"498":{apItemName:"Agency Pickup - Whittleton Creek - Bench",unlockableId:"AGENCYPICKUP_NORTHAMERICA_LARGE_BENCH"},
"499":{apItemName:"Agency Pickup - Whittleton Creek - Park Shed",unlockableId:"AGENCYPICKUP_NORTHAMERICA_LARGE_PARK_SHED"},
"500":{apItemName:"Agency Pickup - Whittleton Creek - Hansons Basement",unlockableId:"AGENCYPICKUP_NORTHAMERICA_LARGE_VACATIONHOUSE"},
"501":{apItemName:"Agency Pickup - Whittleton Creek - Treehouse",unlockableId:"AGENCYPICKUP_NORTHAMERICA_LARGE_TREEHOUSE"},
"502":{apItemName:"Agency Pickup - Whittleton Creek - Cassidys Attic",unlockableId:"AGENCYPICKUP_NORTHAMERICA_LARGE_CASSIDYS_ATTIC"},
"503":{apItemName:"Hidden Stash - Whittleton Creek - R. Cross Driveway",unlockableId:"AGENCYPICKUP_NORTHAMERICA_SMALL_GARROS_DRIVEWAY"},
"504":{apItemName:"Hidden Stash - Whittleton Creek - Park",unlockableId:"AGENCYPICKUP_NORTHAMERICA_SMALL_PARK"},
"505":{apItemName:"Hidden Stash - Whittleton Creek - Lewinskys House",unlockableId:"AGENCYPICKUP_NORTHAMERICA_SMALL_RENOVATION_HOUSE"},
"506":{apItemName:"Hidden Stash - Whittleton Creek - Creek Shed",unlockableId:"AGENCYPICKUP_NORTHAMERICA_SMALL_CREEK_SHED"},
"507":{apItemName:"Hidden Stash - Whittleton Creek - Helens Garage",unlockableId:"AGENCYPICKUP_NORTHAMERICA_SMALL_HELENS_GARAGE"},
"508":{apItemName:"Hidden Stash - Whittleton Creek - Battys Garden",unlockableId:"AGENCYPICKUP_NORTHAMERICA_SMALL_BATTYS_GARDEN"},
"509":{apItemName:"Hidden Stash - Whittleton Creek - House For Sale",unlockableId:"AGENCYPICKUP_NORTHAMERICA_SMALL_HOUSE_FOR_SALE"},
"510":{apItemName:"Hidden Stash - Whittleton Creek - Janus Kitchen",unlockableId:"AGENCYPICKUP_NORTHAMERICA_SMALL_JANUS_KITCHEN"},
"511":{apItemName:"Starting Location - Sapienza - Portico",unlockableId:"STARTING_LOCATION_SAPIENZA_EBOLA"},
"512":{apItemName:"Starting Location - Bangkok - Hotel Front Terrace",unlockableId:"STARTING_LOCATION_BANGKOK_ZIKA"},
"513":{apItemName:"Starting Location - Colorado - Sniper Tower",unlockableId:"STARTING_LOCATION_COLORADO_RABIES"},
"514":{apItemName:"Starting Location - Hokkaido - Infiltrating below the Helipad",unlockableId:"STARTING_LOCATION_HOKKAIDO_FLU"},
"515":{apItemName:"Starting Location - Hokkaido - STARTING_LOCATION_HOKKAIDO_MAMUSHI",unlockableId:"STARTING_LOCATION_HOKKAIDO_MAMUSHI"},
"516":{apItemName:"Explosive - RFID Triggered Explosive",unlockableId:"PROP_DEVICE_ICA_RFID_COIN_EXPLOSIVE"},
"517":{apItemName:"Distraction - ICA Commendable Performance Coin",unlockableId:"PROP_TOOL_COPPER_COIN_H2_REWARD"},
"518":{apItemName:"Distraction - ICA Superior Performance Coin",unlockableId:"PROP_TOOL_SILVER_COIN_H2_REWARD"},
"519":{apItemName:"Distraction - ICA Outstanding Performance Coin",unlockableId:"PROP_TOOL_GOLD_COIN_H2_REWARD"},
"520":{apItemName:"Distraction - ICA Commendable Service Coin",unlockableId:"PROP_TOOL_COMMENDABLE_COIN_H3_REWARD"},
"521":{apItemName:"Distraction - ICA Outstanding Service Coin",unlockableId:"PROP_TOOL_OUTSTANDING_COIN_H3_REWARD"},
"522":{apItemName:"Distraction - ICA Superior Service Coin",unlockableId:"PROP_TOOL_SUPPERIOR_COIN_H3_REWARD"},
"523":{apItemName:"Distraction - Greedy Little Coin",unlockableId:"PROP_TOOL_GREED_COIN"},
"524":{apItemName:"Distraction - Red-Tie Kiwi",unlockableId:"PROP_TOOL_SQUEAKY_TOY_KIWI"},
"525":{apItemName:"Starting Location - Hawkes Bay - Boat",unlockableId:"STARTING_LOCATION_NEWZEALAND_BOAT"},
"526":{apItemName:"Starting Location - Hawkes Bay - Beach",unlockableId:"STARTING_LOCATION_NEWZEALAND_BEACH"},
"527":{apItemName:"Starting Location - Hawkes Bay - STARTING_LOCATION_NEWZEALAND_HUT",unlockableId:"STARTING_LOCATION_NEWZEALAND_HUT"},
"528":{apItemName:"Starting Location - Hawkes Bay - Office",unlockableId:"STARTING_LOCATION_NEWZEALAND_OFFICE"},
"529":{apItemName:"Starting Location - Hawkes Bay - STARTING_LOCATION_NEWZEALAND_BED",unlockableId:"STARTING_LOCATION_NEWZEALAND_BED"},
"530":{apItemName:"Suit - The Jack-O'-Lantern Suit",unlockableId:"TOKEN_OUTFIT_NEWZEALAND_HERO_OPUNTIA_SUIT"},
"531":{apItemName:"Starting Location - Miami - Event Entrance",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_MAIN_ENTRANCE"},
"532":{apItemName:"Starting Location - Miami - Dolphin Fountain",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_EXPO_ENTRANCE"},
"533":{apItemName:"Starting Location - Miami - Kronstadt Bayside Center",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_EXPO"},
"534":{apItemName:"Starting Location - Miami - Medical Area",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_MEDICAL_AREA"},
"535":{apItemName:"Starting Location - Miami - Stands",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_STANDS"},
"536":{apItemName:"Starting Location - Miami - STARTING_LOCATION_MIAMI_SAMBUCA_EXPO",unlockableId:"STARTING_LOCATION_MIAMI_SAMBUCA_EXPO"},
"537":{apItemName:"Starting Location - Miami - Marina",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_MARINA"},
"538":{apItemName:"Starting Location - Miami - Food Stand",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_FOOD_TRUCK"},
"539":{apItemName:"Starting Location - Miami - Podium",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_PODIUM"},
"540":{apItemName:"Starting Location - Miami - Kowoon Pit",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_GARAGEPIT"},
"541":{apItemName:"Starting Location - Miami - Drivers' Lounge",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_VIPLOUNGE"},
"542":{apItemName:"Starting Location - Miami - Overpass",unlockableId:"STARTING_LOCATION_MIAMI_FLAMINGO_HOTEL"},
"543":{apItemName:"Starting Location - Santa Fortuna - Coca Fields",unlockableId:"STARTING_LOCATION_COLOMBIA_HIPPO_COCAFIELD"},
"544":{apItemName:"Starting Location - Santa Fortuna - Construction Site",unlockableId:"STARTING_LOCATION_COLOMBIA_HIPPO_CONSTRUCTIONSITE"},
"545":{apItemName:"Starting Location - Santa Fortuna - Submarine Cave",unlockableId:"STARTING_LOCATION_COLOMBIA_HIPPO_SUBMARINECAVE"},
"546":{apItemName:"Starting Location - Santa Fortuna - Village Hostel",unlockableId:"STARTING_LOCATION_COLOMBIA_HIPPO_HOSTEL"},
"547":{apItemName:"Starting Location - Santa Fortuna - Shaman's Hut",unlockableId:"STARTING_LOCATION_COLOMBIA_HIPPO_JUNGLE"},
"548":{apItemName:"Starting Location - Santa Fortuna - Mansion Basement",unlockableId:"STARTING_LOCATION_COLOMBIA_HIPPO_MANSION"},
"549":{apItemName:"Starting Location - Santa Fortuna - Village Bus Stop",unlockableId:"STARTING_LOCATION_COLOMBIA_HIPPO_VILLAGEBUS"},
"550":{apItemName:"Starting Location - Santa Fortuna - Steel Bridge",unlockableId:"STARTING_LOCATION_COLOMBIA_ANACONDA_BRIDGE"},
"551":{apItemName:"Starting Location - Santa Fortuna - Village Bar",unlockableId:"STARTING_LOCATION_COLOMBIA_HIPPO_VILLAGEBAR"},
"552":{apItemName:"Starting Location - Santa Fortuna - STARTING_LOCATION_COLOMBIA_CALLUNA_COCAFIELD",unlockableId:"STARTING_LOCATION_COLOMBIA_CALLUNA_COCAFIELD"},
"553":{apItemName:"Starting Location - Santa Fortuna - STARTING_LOCATION_COLOMBIA_OUTBREAK_FISHING_VILLAGE",unlockableId:"STARTING_LOCATION_COLOMBIA_OUTBREAK_FISHING_VILLAGE"},
"554":{apItemName:"Starting Location - Santa Fortuna - STARTING_LOCATION_COLOMBIA_OUTBREAK_VILLAGE",unlockableId:"STARTING_LOCATION_COLOMBIA_OUTBREAK_VILLAGE"},
"555":{apItemName:"Starting Location - Santa Fortuna - STARTING_LOCATION_COLOMBIA_OUTBREAK_COCAFIELDS",unlockableId:"STARTING_LOCATION_COLOMBIA_OUTBREAK_COCAFIELDS"},
"556":{apItemName:"Starting Location - Santa Fortuna - STARTING_LOCATION_COLOMBIA_OUTBREAK_CAVES",unlockableId:"STARTING_LOCATION_COLOMBIA_OUTBREAK_CAVES"},
"557":{apItemName:"Starting Location - Mumbai - Main street",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_MAIN_ENTRANCE"},
"558":{apItemName:"Starting Location - Mumbai - Outside Chawl",unlockableId:"STARTING_LOCATION_MUMBAI_KINGCOBRA_CHAWL"},
"559":{apItemName:"Starting Location - Mumbai - Train",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_TRAIN"},
"560":{apItemName:"Starting Location - Mumbai - Boat",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_BOAT"},
"561":{apItemName:"Starting Location - Mumbai - Taxi",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_TAXI"},
"562":{apItemName:"Starting Location - Mumbai - Skywalk",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_SKYWALK"},
"563":{apItemName:"Starting Location - Mumbai - Chawls",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_KASHMERIAN"},
"564":{apItemName:"Starting Location - Mumbai - Laundry",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_LAUNDRY"},
"565":{apItemName:"Starting Location - Mumbai - Train yard",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_TRAINYARD"},
"566":{apItemName:"Starting Location - Mumbai - Slums",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_SLUMS"},
"567":{apItemName:"Starting Location - Mumbai - Photoshoot",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_APARTMENT"},
"568":{apItemName:"Starting Location - Mumbai - Barge",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_BARGE"},
"569":{apItemName:"Starting Location - Mumbai - Metal Forge",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_FORGE"},
"570":{apItemName:"Starting Location - Mumbai - Hill",unlockableId:"STARTING_LOCATION_MUMBAI_MONGOOSE_HILL"},
"571":{apItemName:"Starting Location - Whittleton Creek - Whittleton Creek",unlockableId:"STARTING_LOCATION_NORTHAMERICA_SKUNK_BENCH"},
"572":{apItemName:"Starting Location - Whittleton Creek - Garbage Removal",unlockableId:"STARTING_LOCATION_NORTHAMERICA_SKUNK_GARBAGE"},
"573":{apItemName:"Starting Location - Whittleton Creek - Construction Area",unlockableId:"STARTING_LOCATION_NORTHAMERICA_SKUNK_CONSTRUCTION"},
"574":{apItemName:"Starting Location - Whittleton Creek - BBQ Party",unlockableId:"STARTING_LOCATION_NORTHAMERICA_SKUNK_BBQ"},
"575":{apItemName:"Starting Location - Whittleton Creek - Suburb Sign",unlockableId:"STARTING_LOCATION_NORTHAMERICA_SKUNK_GARDENER"},
"576":{apItemName:"Starting Location - Whittleton Creek - Fumigation",unlockableId:"STARTING_LOCATION_NORTHAMERICA_SKUNK_FUMIGATION"},
"577":{apItemName:"Starting Location - Whittleton Creek - STARTING_LOCATION_NORTHAMERICA_SKUNK_OUTBREAK_HELICOPTER",unlockableId:"STARTING_LOCATION_NORTHAMERICA_SKUNK_OUTBREAK_HELICOPTER"},
"578":{apItemName:"Suit - The Arkian Tuxedo",unlockableId:"TOKEN_OUTFIT_GOLDEN_MASK"},
"579":{apItemName:"Starting Location - Isle of Sgail - Harbor",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_HARBOUR"},
"580":{apItemName:"Starting Location - Isle of Sgail - Keep",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_KEEP"},
"581":{apItemName:"Starting Location - Isle of Sgail - Chapel",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_EFFIGY"},
"582":{apItemName:"Starting Location - Isle of Sgail - Kitchens",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_WORKER_CHEF"},
"583":{apItemName:"Starting Location - Isle of Sgail - Reception Area",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_WORKER_WAITER"},
"584":{apItemName:"Starting Location - Isle of Sgail - Gallery",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_ARKIAN_TIER2"},
"585":{apItemName:"Starting Location - Isle of Sgail - Architects' Lounge",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_ARKIAN_TIER3"},
"586":{apItemName:"Starting Location - Isle of Sgail - Warehouse",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_WORKER_CUSTODIAN"},
"587":{apItemName:"Starting Location - Isle of Sgail - STARTING_LOCATION_THE_ISLAND_MAGPIE_LOTUS",unlockableId:"STARTING_LOCATION_THE_ISLAND_MAGPIE_LOTUS"},
"588":{apItemName:"Suitcase - ICA Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_ICA"},
"589":{apItemName:"Suitcase - Toolbox",unlockableId:"PROP_CONTAINER_SUITCASE_TOOL_BOX"},
"590":{apItemName:"Suitcase - ICA Executive Briefcase MK II",unlockableId:"PROP_CONTAINER_SUITCASE_SLOW_MK_II"},
"591":{apItemName:"Suitcase - Artic Toolbox",unlockableId:"PROP_CONTAINER_SUITCASE_ARCTIC_TOOL_BOX"},
"592":{apItemName:"Suitcase - Black Leather Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_ICA_CLASSIC"},
"593":{apItemName:"Suitcase - ICA Briefcase MK III",unlockableId:"PROP_CONTAINER_SUITCASE_ICA_S3"},
"594":{apItemName:"Suitcase - Aluminum Travel Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_TRAVELER"},
"595":{apItemName:"Suitcase - Aluminum Travel Briefcase (H3)",unlockableId:"PROP_CONTAINER_SUITCASE_TRAVELER_H3"},
"596":{apItemName:"Suitcase - ICA Executive Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_ICA_DELUXE"},
"597":{apItemName:"Suitcase - Orange Pinstripe Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_ICA_STA"},
"598":{apItemName:"Suitcase - Golden Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_GOLDEN"},
"599":{apItemName:"Suitcase - Hunters Breifcase",unlockableId:"PROP_CONTAINER_SUITCASE_HUNTING"},
"600":{apItemName:"Suitcase - Chinese Briefase",unlockableId:"PROP_CONTAINER_SUITCASE_CHINESE"},
"601":{apItemName:"Suitcase - Premiere White Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_BIRTH"},
"602":{apItemName:"Suitcase - Crimson Red Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_LIFE"},
"603":{apItemName:"Suitcase - Ultimate Black Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_DEATH"},
"604":{apItemName:"Suitcase - The Club Boom 12\" Flightcase",unlockableId:"PROP_CONTAINER_SUITCASE_DJ_BAG"},
"605":{apItemName:"Suitcase - Siger 300 Sniper Case",unlockableId:"PROP_CONTAINER_SUITCASE_SIEGER300"},
"606":{apItemName:"Starting Location - STARTING_LOCATION_MANTIS_OUTBREAK_ROOF",unlockableId:"STARTING_LOCATION_MANTIS_OUTBREAK_ROOF"},
"607":{apItemName:"Starting Location - New York - Bank Entrance",unlockableId:"STARTING_LOCATION_GREEDY_RACCOON_MAIN_ENTRANCE"},
"608":{apItemName:"Starting Location - New York - Investment Floor",unlockableId:"STARTING_LOCATION_GREEDY_RACCOON_INVESTMENTFLOOR_ENTRANCE"},
"609":{apItemName:"Starting Location - New York - First Floor Mezzanine",unlockableId:"STARTING_LOCATION_GREEDY_RACCOON_MAINTENANCE_ENTRANCE"},
"610":{apItemName:"Starting Location - New York - Deposit Box Room",unlockableId:"STARTING_LOCATION_GREEDY_RACCOON_DEPOSITBOXROOM_ENTRANCE"},
"611":{apItemName:"Starting Location - New York - Garage",unlockableId:"STARTING_LOCATION_GREEDY_RACCOON_GARAGE_ENTRANCE"},
"612":{apItemName:"Starting Location - New York - STARTING_LOCATION_GREEDY_RACCOON_DANDELION_GARAGE_ENTRANCE",unlockableId:"STARTING_LOCATION_GREEDY_RACCOON_DANDELION_GARAGE_ENTRANCE"},
"613":{apItemName:"Starting Location - New York - Audit Hall",unlockableId:"STARTING_LOCATION_GREEDY_RACCOON_AUDITHALL_ENTRANCE"},
"614":{apItemName:"Agency Pickup - New York - Vault's Loading Bay",unlockableId:"AGENCYPICKUP_GREEDY_LARGE_GARAGE"},
"615":{apItemName:"Agency Pickup - New York - First Floor Janitor Room",unlockableId:"AGENCYPICKUP_GREEDY_LARGE_FIRSTFLOORJANITOR"},
"616":{apItemName:"Hidden Stash - New York - Deposit Box",unlockableId:"AGENCYPICKUP_GREEDY_SMALL_DEPOSITBOX"},
"617":{apItemName:"Hidden Stash - New York - Second Floor Bathroom",unlockableId:"AGENCYPICKUP_GREEDY_SMALL_2NDFLOORTOILET"},
"618":{apItemName:"Agency Pickup - New York - Executive Floor",unlockableId:"AGENCYPICKUP_GREEDY_LARGE_ASSISTANTSROOM"},
"619":{apItemName:"Hidden Stash - New York - Waiting Area Bathroom",unlockableId:"AGENCYPICKUP_GREEDY_SMALL_1STFLOORTOILET"},
"620":{apItemName:"Starting Location - Haven Island - Resort Pier",unlockableId:"STARTING_LOCATION_OPULENT_STINGRAY_MAIN_PIER"},
"621":{apItemName:"Starting Location - Haven Island - Shark Hut",unlockableId:"STARTING_LOCATION_OPULENT_STINGRAY_47HUT"},
"622":{apItemName:"Starting Location - Haven Island - Resort Pool Area",unlockableId:"STARTING_LOCATION_OPULENT_STINGRAY_POOL"},
"623":{apItemName:"Starting Location - Haven Island - Resort Gym",unlockableId:"STARTING_LOCATION_OPULENT_STINGRAY_GYM"},
"624":{apItemName:"Starting Location - Haven Island - Restaurant's Kitchen",unlockableId:"STARTING_LOCATION_OPULENT_STINGRAY_KITCHEN"},
"625":{apItemName:"Starting Location - Haven Island - Private Villa Pier",unlockableId:"STARTING_LOCATION_OPULENT_STINGRAY_VILLA_PIER"},
"626":{apItemName:"Hidden Stash - Haven Island - Buried In Sand",unlockableId:"AGENCYPICKUP_STINGRAY_SMALL_HIDDENINSAND"},
"627":{apItemName:"Hidden Stash - Haven Island - Laundry Room",unlockableId:"AGENCYPICKUP_STINGRAY_SMALL_LAUNDRYROOM"},
"628":{apItemName:"Hidden Stash - Haven Island - Restaurant Storage Room",unlockableId:"AGENCYPICKUP_STINGRAY_SMALL_STAFFROOM"},
"629":{apItemName:"Agency Pickup - Haven Island - Shark Hut",unlockableId:"AGENCYPICKUP_STINGRAY_LARGE_47HUT"},
"630":{apItemName:"Agency Pickup - Haven Island - Villa Beach Storage Area",unlockableId:"AGENCYPICKUP_STINGRAY_LARGE_VILLABEACH"},
"631":{apItemName:"Agency Pickup - Haven Island - Security Hut",unlockableId:"AGENCYPICKUP_STINGRAY_LARGE_SECURITYHUT"},
"632":{apItemName:"Hidden Stash - Haven Island - Changing Room",unlockableId:"AGENCYPICKUP_STINGRAY_SMALL_SPACHANGINGROOM"},
"633":{apItemName:"Hidden Stash - Haven Island - Villa Bathroom",unlockableId:"AGENCYPICKUP_STINGRAY_SMALL_VILLA_BATHROOM"},
"634":{apItemName:"Hidden Stash - Haven Island - Underground Storage Room",unlockableId:"AGENCYPICKUP_STINGRAY_SMALL_UNDERGROUND_STORAGE"},
"635":{apItemName:"Suit - The Buccaneer",unlockableId:"TOKEN_OUTFIT_HERO_PIRATE_SUIT"},
"636":{apItemName:"Starting Location - STARTING_LOCATION_OPULENT_ARCTICTHYME_PIRATE",unlockableId:"STARTING_LOCATION_OPULENT_ARCTICTHYME_PIRATE"},
"637":{apItemName:"Suit - The Devil's Own",unlockableId:"TOKEN_OUTFIT_HERO_GOLDEN_DEVIL_SUIT"},
"638":{apItemName:"Suit - Formal Hunting Attire",unlockableId:"TOKEN_OUTFIT_HERO_HUNTING_SUIT"},
"639":{apItemName:"Suit - The Black Dragon",unlockableId:"TOKEN_OUTFIT_HERO_CHINESE_SUIT"},
"640":{apItemName:"Suit - Guru Suit",unlockableId:"TOKEN_OUTFIT_HERO_GURU_SUIT"},
"641":{apItemName:"Suit - The Yellow Rabbit",unlockableId:"TOKEN_OUTFIT_HERO_EASTER_SUIT"},
"642":{apItemName:"Suit - The White Shadow",unlockableId:"TOKEN_OUTFIT_HERO_WHITE_NINJA_SUIT"},
"643":{apItemName:"Suit - The Butcher",unlockableId:"TOKEN_OUTFIT_HERO_BUTCHER_SUIT"},
"644":{apItemName:"Suit - The Big, Bad Wolf Suit",unlockableId:"TOKEN_OUTFIT_HERO_BBW_SUIT"},
"645":{apItemName:"Suit - The Strait Jacket",unlockableId:"TOKEN_OUTFIT_HERO_ASYLUM_SUIT"},
"646":{apItemName:"Suit - The Raver",unlockableId:"TOKEN_OUTFIT_HERO_EASTER_RAVER_SUIT"},
"647":{apItemName:"Suit - TOKEN_OUTFIT_HERO_EASTER_RAVER_BUNNY_SUIT",unlockableId:"TOKEN_OUTFIT_HERO_EASTER_RAVER_BUNNY_SUIT"},
"648":{apItemName:"Suit - The Ruby Rude Track Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_RUBYRUDE_SUIT"},
"649":{apItemName:"Suit - The Neon Ninja Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_NEON_SUIT"},
"650":{apItemName:"Suit - The Lucky Ducky Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_DUCKY_SUIT"},
"651":{apItemName:"Suit - The Sandman Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_HALLOWEENSANSPUMPKIN_SUIT"},
"652":{apItemName:"Suit - Super Fan",unlockableId:"TOKEN_OUTFIT_HERO_SUPERFAN"},
"653":{apItemName:"Suit - Plague Doctor",unlockableId:"TOKEN_OUTFIT_HERO_PLAGUEDOCTOR"},
"654":{apItemName:"Suit - Summer Sightseeing Suit With Gloves",unlockableId:"TOKEN_OUTFIT_HERO_SUMMER_SUIT"},
"655":{apItemName:"Suit - Agent 17's Signature Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_AGENT17_SUIT"},
"656":{apItemName:"Suit - The Codename 47 Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_LEGACY47_SUIT"},
"657":{apItemName:"Suit - The Cozy Christmas Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_CHRISTMASJUMPER_SUIT"},
"658":{apItemName:"Suit - The Rapacious Suit",unlockableId:"TOKEN_OUTFIT_HERO_GREED_SUIT"},
"659":{apItemName:"Suit - The Narcissus Suit",unlockableId:"TOKEN_OUTFIT_HERO_PRIDE_SUIT"},
"660":{apItemName:"Suit - The Lotophage Suit",unlockableId:"TOKEN_OUTFIT_HERO_SLOTH_SUIT"},
"661":{apItemName:"Suit - The Scarlet Suit",unlockableId:"TOKEN_OUTFIT_HERO_LUST_SUIT"},
"662":{apItemName:"Suit - The Profligacy Suit",unlockableId:"TOKEN_OUTFIT_HERO_GLUTTONY_SUIT"},
"663":{apItemName:"Suit - The Temper Suit",unlockableId:"TOKEN_OUTFIT_HERO_WRATH_SUIT"},
"664":{apItemName:"Suit - The Odium Suit",unlockableId:"TOKEN_OUTFIT_HERO_ENVY_SUIT"},
"665":{apItemName:"Suit - Premiere White Suit",unlockableId:"TOKEN_OUTFIT_HERO_BIRTH_SUIT"},
"666":{apItemName:"Suit - Crimson Red Suit",unlockableId:"TOKEN_OUTFIT_HERO_LIFE_SUIT"},
"667":{apItemName:"Suit - Ultimate Black Suit",unlockableId:"TOKEN_OUTFIT_HERO_DEATH_SUIT"},
"668":{apItemName:"Suit - The Blue Streak Suit",unlockableId:"TOKEN_OUTFIT_HERO_BLUESPECIAL_SUIT"},
"669":{apItemName:"Suit - White Sunset Suit",unlockableId:"TOKEN_OUTFIT_HERO_REDSPECIAL_SUIT"},
"670":{apItemName:"Suit - The Green Streak Suit",unlockableId:"TOKEN_OUTFIT_HERO_GREENSPECIAL_SUIT"},
"671":{apItemName:"Suit - The Black Streak Suit",unlockableId:"TOKEN_OUTFIT_HERO_BLACKSPECIAL_SUIT"},
"672":{apItemName:"Suit - The Purple Streak Suit",unlockableId:"TOKEN_OUTFIT_HERO_PURPLESPECIAL_SUIT"},
"673":{apItemName:"Suit - Solstice Suit",unlockableId:"TOKEN_OUTFIT_HERO_H3_LEGACYREWARD_SUIT"},
"674":{apItemName:"Suit - Ashen Suit With Gloves",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_GECKO_SUIT"},
"675":{apItemName:"Suit - The Public Enemy Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_PUBLICENEMY_SUIT"},
"676":{apItemName:"Suit - Classic Cut Long Coat Suit With Gloves",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_BULLDOG_SUIT"},
"677":{apItemName:"Suit - Number Six With Gloves",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_FOX_SUIT"},
"678":{apItemName:"Suit - Rave On Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_RAVING_SUIT"},
"679":{apItemName:"Suit - Polar Survival Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_FALCON_ICE_SUIT"},
"680":{apItemName:"Suit - Neon City Suit With Gloves",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_RAT_SUIT"},
"681":{apItemName:"Suit - Black & White Tuxedo Set With Gloves",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_LLAMA_SUIT"},
"682":{apItemName:"Suit - Subject 47",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_WOLVERINE_SUIT"},
"683":{apItemName:"Suit - TOKEN_OUTFIT_HERO_GECKO_SUIT",unlockableId:"TOKEN_OUTFIT_HERO_GECKO_SUIT"},
"684":{apItemName:"Starting Location - Dubai - Burj Al-Ghazali Exterior",unlockableId:"STARTING_LOCATION_GOLDEN_GECKO_OUTSIDE_DEFAULT"},
"685":{apItemName:"Starting Location - Dubai - STARTING_LOCATION_GOLDEN_GECKO_OUTSIDE_DEFAULT_COMMENTARY",unlockableId:"STARTING_LOCATION_GOLDEN_GECKO_OUTSIDE_DEFAULT_COMMENTARY"},
"686":{apItemName:"Starting Location - Dubai - Atrium Lobby",unlockableId:"STARTING_LOCATION_GOLDEN_GECKO_INSIDE_DEFAULT"},
"687":{apItemName:"Starting Location - Dubai - Meeting Room",unlockableId:"STARTING_LOCATION_GOLDEN_GECKO_MEETING_ROOM_STAFF"},
"688":{apItemName:"Starting Location - Dubai - Art Installation",unlockableId:"STARTING_LOCATION_GOLDEN_GECKO_ART_INSTALLATION_TECHNICIAN"},
"689":{apItemName:"Starting Location - Dubai - Guard Room",unlockableId:"STARTING_LOCATION_GOLDEN_GECKO_GUARD_ROOM_GUARD"},
"690":{apItemName:"Starting Location - Dubai - Penthouse",unlockableId:"STARTING_LOCATION_GOLDEN_GECKO_PENTHOUSE_STAFF"},
"691":{apItemName:"Starting Location - Dubai - STARTING_LOCATION_GOLDEN_ANGELICA_GOLDBAR",unlockableId:"STARTING_LOCATION_GOLDEN_ANGELICA_GOLDBAR"},
"692":{apItemName:"Starting Location - Dubai - STARTING_LOCATION_GOLDEN_GIBSON_INSIDE_DEFAULT",unlockableId:"STARTING_LOCATION_GOLDEN_GIBSON_INSIDE_DEFAULT"},
"693":{apItemName:"Agency Pickup - Dubai - Maintenance Room",unlockableId:"AGENCYPICKUP_GOLDEN_LARGE_JANITORROOM"},
"694":{apItemName:"Agency Pickup - Dubai - Penthouse Supply Room",unlockableId:"AGENCYPICKUP_GOLDEN_LARGE_PENTHOUSESUPPLYROOM"},
"695":{apItemName:"Agency Pickup - Dubai - Art Backstage Balcony",unlockableId:"AGENCYPICKUP_GOLDEN_LARGE_BACKSTAGEBALCONY"},
"696":{apItemName:"Agency Pickup - Dubai - Penthouse Ventilation Area",unlockableId:"AGENCYPICKUP_GOLDEN_LARGE_PENTHOUSEMAINTENANCE"},
"697":{apItemName:"Hidden Stash - Dubai - Kitchen",unlockableId:"AGENCYPICKUP_GOLDEN_SMALL_KITCHEN"},
"698":{apItemName:"Hidden Stash - Dubai - Laundry Room",unlockableId:"AGENCYPICKUP_GOLDEN_SMALL_LAUNDRYROOM"},
"699":{apItemName:"Hidden Stash - Dubai - Atrium Toilet",unlockableId:"AGENCYPICKUP_GOLDEN_SMALL_ATRIUMTOILET"},
"700":{apItemName:"Suit - TOKEN_OUTFIT_ANCESTRAL_HERO_ANCESTRALSUIT",unlockableId:"TOKEN_OUTFIT_ANCESTRAL_HERO_ANCESTRALSUIT"},
"701":{apItemName:"Suit - TOKEN_OUTFIT_ANCESTRAL_HERO_SMOOTHSNAKESUIT",unlockableId:"TOKEN_OUTFIT_ANCESTRAL_HERO_SMOOTHSNAKESUIT"},
"702":{apItemName:"Starting Location - Dartmoor - Main Road",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_DEFAULT_SUIT"},
"703":{apItemName:"Starting Location - Dartmoor - Directors Commentary - Mission Introduction",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_DEFAULT_COMMENTARY_SUIT"},
"704":{apItemName:"Starting Location - Dartmoor - Main Road (Skipped)",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_DEFAULT_SUIT_B"},
"705":{apItemName:"Starting Location - Dartmoor - Behind Mansion",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_BEHINDMANSION_SUIT"},
"706":{apItemName:"Starting Location - Dartmoor - Behind Mansion (Skipped)",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_BEHINDMANSION_SUIT_B"},
"707":{apItemName:"Starting Location - Dartmoor - Garden",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_GARDEN_GARDENER"},
"708":{apItemName:"Starting Location - Dartmoor - Library",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_LIBRARY_MANSIONSTAFF"},
"709":{apItemName:"Starting Location - Dartmoor - Staff Room",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_STAFFROOM_MANSIONGUARD"},
"710":{apItemName:"Starting Location - Dartmoor - Zachery's Bedroom",unlockableId:"STARTING_LOCATION_ANCESTRAL_BULLDOG_ZACHARYSROOM_INVESTIGATOR"},
"711":{apItemName:"Starting Location - Dartmoor - STARTING_LOCATION_ANCESTRAL_FERN_BEHINDMANSION_HUNTINGSUIT_B",unlockableId:"STARTING_LOCATION_ANCESTRAL_FERN_BEHINDMANSION_HUNTINGSUIT_B"},
"712":{apItemName:"Starting Location - Dartmoor - STARTING_LOCATION_ANCESTRAL_SMOOTHSNAKE_FRONTMANSION_SUIT",unlockableId:"STARTING_LOCATION_ANCESTRAL_SMOOTHSNAKE_FRONTMANSION_SUIT"},
"713":{apItemName:"Starting Location - Dartmoor - STARTING_LOCATION_ANCESTRAL_SMOOTHSNAKE_FRONTMANSION_SUIT_B",unlockableId:"STARTING_LOCATION_ANCESTRAL_SMOOTHSNAKE_FRONTMANSION_SUIT_B"},
"714":{apItemName:"Starting Location - STARTING_LOCATION_HOLLYHOCK_DEFAULT",unlockableId:"STARTING_LOCATION_HOLLYHOCK_DEFAULT"},
"715":{apItemName:"Hidden Stash - Dartmoor - Deliveries",unlockableId:"AGENCYPICKUP_ANCESTRAL_SMALL_DELIVERIES"},
"716":{apItemName:"Hidden Stash - Dartmoor - Library",unlockableId:"AGENCYPICKUP_ANCESTRAL_SMALL_LIBRARY"},
"717":{apItemName:"Agency Pickup - Dartmoor - Graveyard",unlockableId:"AGENCYPICKUP_ANCESTRAL_LARGE_GRAVEYARD"},
"718":{apItemName:"Agency Pickup - Dartmoor - Changing room",unlockableId:"AGENCYPICKUP_ANCESTRAL_LARGE_CHANGINGROOM"},
"719":{apItemName:"Hidden Stash - Dartmoor - Greenhouse",unlockableId:"AGENCYPICKUP_ANCESTRAL_SMALL_GREENHOUSE"},
"720":{apItemName:"Agency Pickup - Dartmoor - Hallway",unlockableId:"AGENCYPICKUP_ANCESTRAL_LARGE_HALLWAY"},
"721":{apItemName:"Agency Pickup - Dartmoor - Bathroom",unlockableId:"AGENCYPICKUP_ANCESTRAL_LARGE_RESTROOM"},
"722":{apItemName:"Hidden Stash - Dartmoor - Laundry Room",unlockableId:"AGENCYPICKUP_ANCESTRAL_SMALL_LAUNDRYROOM"},
"723":{apItemName:"Suit - TOKEN_OUTFIT_EDGY_HERO_EDGYSUIT",unlockableId:"TOKEN_OUTFIT_EDGY_HERO_EDGYSUIT"},
"724":{apItemName:"Starting Location - Berlin - Bus Stop",unlockableId:"STARTING_LOCATION_EDGY_FOX_DEFAULT"},
"725":{apItemName:"Starting Location - Berlin - Directors Commentary - Mission Introduction",unlockableId:"STARTING_LOCATION_EDGY_FOX_DEFAULT_COMMENTARY"},
"726":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_DEFAULT_CONTRACTCREATION",unlockableId:"STARTING_LOCATION_EDGY_FOX_DEFAULT_CONTRACTCREATION"},
"727":{apItemName:"Starting Location - Berlin - Radio Tower",unlockableId:"STARTING_LOCATION_EDGY_FOX_FOREST_TOWER"},
"728":{apItemName:"Starting Location - Berlin - Biker Hangout",unlockableId:"STARTING_LOCATION_EDGY_FOX_BIKER_LOUNGE"},
"729":{apItemName:"Starting Location - Berlin - Projection Bar",unlockableId:"STARTING_LOCATION_EDGY_FOX_B1_BAR"},
"730":{apItemName:"Starting Location - Berlin - DJ Booth",unlockableId:"STARTING_LOCATION_EDGY_FOX_DJ_BOOTH"},
"731":{apItemName:"Starting Location - Berlin - Chill Out",unlockableId:"STARTING_LOCATION_EDGY_FOX_CHILLOUT_AREA"},
"732":{apItemName:"Starting Location - Berlin - Club Entrance",unlockableId:"STARTING_LOCATION_EDGY_FOX_CLUB_ENTRANCE"},
"733":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_RADLER_CLUB_ENTRANCE",unlockableId:"STARTING_LOCATION_EDGY_RADLER_CLUB_ENTRANCE"},
"734":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_TOMORROWLAND_CLUB_ENTRANCE",unlockableId:"STARTING_LOCATION_EDGY_TOMORROWLAND_CLUB_ENTRANCE"},
"735":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_NIGHTPHLOX_B1_BAR",unlockableId:"STARTING_LOCATION_EDGY_FOX_NIGHTPHLOX_B1_BAR"},
"736":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_NIGHTPHLOX_CLUB_ENTRANCE",unlockableId:"STARTING_LOCATION_EDGY_FOX_NIGHTPHLOX_CLUB_ENTRANCE"},
"737":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_NIGHTPHLOX_CHILLOUT_AREA",unlockableId:"STARTING_LOCATION_EDGY_FOX_NIGHTPHLOX_CHILLOUT_AREA"},
"738":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_NIGHTPHLOX_DJ_BOOTH",unlockableId:"STARTING_LOCATION_EDGY_FOX_NIGHTPHLOX_DJ_BOOTH"},
"739":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_GRASSSNAKE_FORRESTEDGE",unlockableId:"STARTING_LOCATION_EDGY_FOX_GRASSSNAKE_FORRESTEDGE"},
"740":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_GRASSSNAKE_EVENTAREA",unlockableId:"STARTING_LOCATION_EDGY_FOX_GRASSSNAKE_EVENTAREA"},
"741":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_CORNFLOWER_LEVEL1",unlockableId:"STARTING_LOCATION_EDGY_FOX_CORNFLOWER_LEVEL1"},
"742":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_CORNFLOWER_LEVEL2",unlockableId:"STARTING_LOCATION_EDGY_FOX_CORNFLOWER_LEVEL2"},
"743":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_CORNFLOWER_LEVEL3",unlockableId:"STARTING_LOCATION_EDGY_FOX_CORNFLOWER_LEVEL3"},
"744":{apItemName:"Starting Location - Berlin - STARTING_LOCATION_EDGY_FOX_AMBROSIA",unlockableId:"STARTING_LOCATION_EDGY_FOX_AMBROSIA"},
"745":{apItemName:"Agency Pickup - Berlin - Entrance Staff Room",unlockableId:"AGENCYPICKUP_EDGY_LARGE_ENTRANCE"},
"746":{apItemName:"Agency Pickup - Berlin - Chill-Out Stff Trailer",unlockableId:"AGENCYPICKUP_EDGY_LARGE_CHILLOUT_SHED"},
"747":{apItemName:"Agency Pickup - Berlin - Overpass",unlockableId:"AGENCYPICKUP_EDGY_LARGE_ABANDONED_TOWER_ROOM"},
"748":{apItemName:"Agency Pickup - Berlin - Basement Boiler Room",unlockableId:"AGENCYPICKUP_EDGY_LARGE_B2_ABANDONED_ROOM"},
"749":{apItemName:"Agency Pickup - Berlin - Skylight Access",unlockableId:"AGENCYPICKUP_EDGY_LARGE_F0_TRASH_ROOM"},
"750":{apItemName:"Hidden Stash - Berlin - Projection Bar",unlockableId:"AGENCYPICKUP_EDGY_SMALL_B1_BAR"},
"751":{apItemName:"Hidden Stash - Berlin - Basement Toilet",unlockableId:"AGENCYPICKUP_EDGY_SMALL_B2_TOILET"},
"752":{apItemName:"Hidden Stash - Berlin - Biker Garage",unlockableId:"AGENCYPICKUP_EDGY_SMALL_BIKER_GARAGE"},
"753":{apItemName:"Suit - TOKEN_OUTFIT_WET_HERO_WETSUIT",unlockableId:"TOKEN_OUTFIT_WET_HERO_WETSUIT"},
"754":{apItemName:"Agency Pickup - Chongqing - Facility Maintenance Tunnel",unlockableId:"AGENCYPICKUP_WET_LARGE_BLOCKROOF"},
"755":{apItemName:"Agency Pickup - Chongqing - Arcade",unlockableId:"AGENCYPICKUP_WET_LARGE_COURTYARD"},
"756":{apItemName:"Agency Pickup - Chongqing - Corridor",unlockableId:"AGENCYPICKUP_WET_LARGE_BLOCKF3"},
"757":{apItemName:"Agency Pickup - Chongqing - Side Alley",unlockableId:"AGENCYPICKUP_WET_LARGE_ALLEY"},
"758":{apItemName:"Agency Pickup - Chongqing - Apartment",unlockableId:"AGENCYPICKUP_WET_LARGE_APARTMENT"},
"759":{apItemName:"Hidden Stash - Chongqing - The Laundry",unlockableId:"AGENCYPICKUP_WET_SMALL_LAUNDRY"},
"760":{apItemName:"Hidden Stash - Chongqing - Facility Rooftop",unlockableId:"AGENCYPICKUP_WET_SMALL_FACILITYROOF"},
"761":{apItemName:"Hidden Stash - Chongqing - Facility Ventilation Room",unlockableId:"AGENCYPICKUP_WET_SMALL_FACILITYVENT"},
"762":{apItemName:"Hidden Stash - Chongqing - Facility Server Supply Room",unlockableId:"AGENCYPICKUP_WET_SMALL_ARCADE"},
"763":{apItemName:"Hidden Stash - Chongqing - Restaurant Back Stairwell",unlockableId:"AGENCYPICKUP_WET_SMALL_RESTAURANT"},
"764":{apItemName:"Starting Location - Chongqing - Train Station",unlockableId:"STARTING_LOCATION_WET_RAT_DEFAULT_SUIT"},
"765":{apItemName:"Starting Location - Chongqing - Directors Commentary - Mission Introduction",unlockableId:"STARTING_LOCATION_WET_RAT_DEFAULT_COMMENTARY"},
"766":{apItemName:"Starting Location - Chongqing - Restaurant Kitchen",unlockableId:"STARTING_LOCATION_WET_RAT_RESTURANT"},
"767":{apItemName:"Starting Location - Chongqing - Facility Rooftop",unlockableId:"STARTING_LOCATION_WET_RAT_ROOF"},
"768":{apItemName:"Starting Location - Chongqing - River-side Walkway",unlockableId:"STARTING_LOCATION_WET_RAT_STREET"},
"769":{apItemName:"Starting Location - Chongqing - Balcony",unlockableId:"STARTING_LOCATION_WET_RAT_SIGN"},
"770":{apItemName:"Starting Location - Chongqing - The Block",unlockableId:"STARTING_LOCATION_WET_RAT_BLOCK_SECURITY"},
"771":{apItemName:"Starting Location - Chongqing - Facility Locker Room",unlockableId:"STARTING_LOCATION_WET_RAT_FACILITY_WORKER"},
"772":{apItemName:"Starting Location - Chongqing - STARTING_LOCATION_WET_LAMBIC_DEFAULT",unlockableId:"STARTING_LOCATION_WET_LAMBIC_DEFAULT"},
"773":{apItemName:"Suit - TOKEN_OUTFIT_ELEGANT_HERO_LLAMASUIT",unlockableId:"TOKEN_OUTFIT_ELEGANT_HERO_LLAMASUIT"},
"774":{apItemName:"Starting Location - Mendoza - Winery Viewpoint",unlockableId:"STARTING_LOCATION_ELEGANT_LLAMA_DEFAULT_SUIT"},
"775":{apItemName:"Starting Location - Mendoza - STARTING_LOCATION_ELEGANT_NODIANA_DEFAULT_SUIT",unlockableId:"STARTING_LOCATION_ELEGANT_NODIANA_DEFAULT_SUIT"},
"776":{apItemName:"Starting Location - Mendoza - Directors Commentary - Mission Introduction",unlockableId:"STARTING_LOCATION_ELEGANT_LLAMA_DEFAULT_COMMENTARY"},
"777":{apItemName:"Starting Location - Mendoza - Parking Lot",unlockableId:"STARTING_LOCATION_ELEGANT_LLAMA_PARKINGLOT_SUIT"},
"778":{apItemName:"Starting Location - Mendoza - STARTING_LOCATION_ELEGANT_LLAMA_JACARANDA_DOCKS",unlockableId:"STARTING_LOCATION_ELEGANT_LLAMA_JACARANDA_DOCKS"},
"779":{apItemName:"Starting Location - Mendoza - STARTING_LOCATION_ELEGANT_LLAMA_FRANGIPANI_PARKING",unlockableId:"STARTING_LOCATION_ELEGANT_LLAMA_FRANGIPANI_PARKING"},
"780":{apItemName:"Hidden Stash - Mendoza - Boathouse",unlockableId:"AGENCYPICKUP_ELEGANT_SMALL_BOATHOUSE"},
"781":{apItemName:"Hidden Stash - Mendoza - Worker's Bathroom",unlockableId:"AGENCYPICKUP_ELEGANT_SMALL_WORKERSTOILET"},
"782":{apItemName:"Starting Location - Mendoza - Tasting Room",unlockableId:"STARTING_LOCATION_ELEGANT_LLAMA_TASTINGROOM_WAITER"},
"783":{apItemName:"Agency Pickup - Mendoza - Barrel Room",unlockableId:"AGENCYPICKUP_ELEGANT_LARGE_BARRELROOM"},
"784":{apItemName:"Hidden Stash - Mendoza - Shrine",unlockableId:"AGENCYPICKUP_ELEGANT_SMALL_SHRINEPOT"},
"785":{apItemName:"Hidden Stash - Mendoza - Cinema",unlockableId:"AGENCYPICKUP_ELEGANT_SMALL_CINEMA"},
"786":{apItemName:"Starting Location - Mendoza - Shrine",unlockableId:"STARTING_LOCATION_ELEGANT_LLAMA_SHRINE"},
"787":{apItemName:"Agency Pickup - Mendoza - Steel Tanks",unlockableId:"AGENCYPICKUP_ELEGANT_LARGE_STEELTANKS"},
"788":{apItemName:"Starting Location - Mendoza - Sniper Spot",unlockableId:"STARTING_LOCATION_ELEGANT_LLAMA_STEELTANKS"},
"789":{apItemName:"Agency Pickup - Mendoza - Villa Attic",unlockableId:"AGENCYPICKUP_ELEGANT_LARGE_VILLAATTIC"},
"790":{apItemName:"Starting Location - Mendoza - Vineyard",unlockableId:"STARTING_LOCATION_ELEGANT_GRAPEFIELD_WORKER"},
"791":{apItemName:"Starting Location - Mendoza - Dining Area",unlockableId:"STARTING_LOCATION_ELEGANT_ASADO_CHEF"},
"792":{apItemName:"Agency Pickup - Mendoza - Grapefield Shed",unlockableId:"AGENCYPICKUP_ELEGANT_LARGE_GRAPESHED"},
"793":{apItemName:"Hidden Stash - Mendoza - Dance Floor",unlockableId:"AGENCYPICKUP_ELEGANT_SMALL_DANCEFLOOR"},
"794":{apItemName:"Hidden Stash - Mendoza - Villa Basement",unlockableId:"AGENCYPICKUP_ELEGANT_SMALL_VILLABASEMENT"},
"795":{apItemName:"Suit - TOKEN_OUTFIT_TRAPPED_WOLVERINE_SUIT",unlockableId:"TOKEN_OUTFIT_TRAPPED_WOLVERINE_SUIT"},
"796":{apItemName:"Starting Location - Carpathian Mountains - Reflection",unlockableId:"STARTING_LOCATION_TRAPPED_WOLVERINE_DREAM_DEFAULT"},
"797":{apItemName:"Starting Location - Carpathian Mountains - Laboratory",unlockableId:"STARTING_LOCATION_TRAPPED_WOLVERINE_TRAIN_LAB"},
"798":{apItemName:"Starting Location - Carpathian Mountains - Outdoors",unlockableId:"STARTING_LOCATION_TRAPPED_WOLVERINE_TRAIN_FLATBED"},
"799":{apItemName:"Suit - Guerilla Wetsuit",unlockableId:"TOKEN_OUTFIT_HERO_DUGONG_SUIT"},
"800":{apItemName:"Starting Location - Ambrose Island - Western Beach",unlockableId:"STARTING_LOCATION_ROCKY_DEFAULT"},
"801":{apItemName:"Starting Location - Ambrose Island - Shrine",unlockableId:"STARTING_LOCATION_ROCKY_SHRINE"},
"802":{apItemName:"Starting Location - Ambrose Island - Central Social Hub",unlockableId:"STARTING_LOCATION_ROCKY_SOCIALHUB"},
"803":{apItemName:"Starting Location - Ambrose Island - Stilt Village",unlockableId:"STARTING_LOCATION_ROCKY_WATERVILLAGE"},
"804":{apItemName:"Starting Location - Ambrose Island - Militia Camp",unlockableId:"STARTING_LOCATION_ROCKY_MILITIACAMP"},
"805":{apItemName:"Starting Location - Ambrose Island - Pirate Camp",unlockableId:"STARTING_LOCATION_ROCKY_PIRATECAMP"},
"806":{apItemName:"Hidden Stash - Ambrose Island - Shrine",unlockableId:"AGENCYPICKUP_ROCKY_SMALL_SHRINE"},
"807":{apItemName:"Hidden Stash - Ambrose Island - Big Tree",unlockableId:"AGENCYPICKUP_ROCKY_SMALL_BIGCENTRALTREE"},
"808":{apItemName:"Hidden Stash - Ambrose Island - Farah's Place",unlockableId:"AGENCYPICKUP_ROCKY_SMALL_TRASHCAN_SOCIALHUB"},
"809":{apItemName:"Agency Pickup - Ambrose Island - Colonial Ruins",unlockableId:"AGENCYPICKUP_ROCKY_LARGE_RUINS"},
"810":{apItemName:"Agency Pickup - Ambrose Island - Green Container",unlockableId:"AGENCYPICKUP_ROCKY_LARGE_RADARTOWER"},
"811":{apItemName:"Agency Pickup - Ambrose Island - Boat Cradle",unlockableId:"AGENCYPICKUP_ROCKY_LARGE_BOATNEARWORKSHOP"},
"812":{apItemName:"Agency Pickup - Ambrose Island - Food Storage",unlockableId:"AGENCYPICKUP_ROCKY_LARGE_FOODSTORAGE_SOCIALHUB"},
"813":{apItemName:"Pistol - The Ornamental Pistol",unlockableId:"FIREARMS_HERO_PISTOL_BARTOLI_75_LUXURIOUS"},
"814":{apItemName:"Shotgun - The Ornamental Shotgun",unlockableId:"FIREARMS_HERO_SHOTGUN_SEMIAUTO_ENRAM_HV_LUXURIOUS"},
"815":{apItemName:"Assault Rifle - The Ornamental Assault Rifle",unlockableId:"FIREARMS_HERO_RIFLE_FULLAUTO_TAC_4_AUTO_LUXURIOUS"},
"816":{apItemName:"SMG - The Ornamental SMG",unlockableId:"FIREARMS_HERO_SMG_TAC_SMG_LUXURIOUS"},
"817":{apItemName:"Sniper - The Ornamental Sniper Rifle",unlockableId:"FIREARMS_HERO_SNIPER_MEDIUM_SIEGER_300_LUXURIOUS"},
"818":{apItemName:"Melee - The Ornamental Katana",unlockableId:"PROP_MELEE_KATANA_LUXURIOUS"},
"819":{apItemName:"Suit - The Golden Contender Suit",unlockableId:"EG_MASTERY_SKIN_LUXURIOUS_SUIT"},
"820":{apItemName:"Pistol - The Scrap Gun",unlockableId:"FIREARMS_HERO_PISTOL_MAKESHIFT"},
"821":{apItemName:"Shotgun - The Makeshift Scrap Shotgun",unlockableId:"FIREARMS_HERO_SHOTGUN_MAKESHIFT"},
"822":{apItemName:"Assault Rifle - The Makeshift Scrap Assault Rifle",unlockableId:"FIREARMS_HERO_RIFLE_MAKESHIFT"},
"823":{apItemName:"SMG - The Scrap SMG",unlockableId:"FIREARMS_HERO_SMG_TAC_SMG_MAKESHIFT"},
"824":{apItemName:"Sniper - The Scrappy Sniper Rifle",unlockableId:"FIREARMS_HERO_SNIPER_MAKESHIFT"},
"825":{apItemName:"Melee - The Makeshift Katana",unlockableId:"PROP_MELEE_KATANA_MAKESHIFT"},
"826":{apItemName:"Suit - The Scrap Poncho Suit",unlockableId:"TOKEN_OUTFIT_HERO_MAKESHIFT"},
"827":{apItemName:"Pistol - The Concrete Bunny Pistol",unlockableId:"FIREARMS_HERO_PISTOL_CONCRETEART"},
"828":{apItemName:"Shotgun - The Concrete Shotgun",unlockableId:"FIREARMS_HERO_SHOTGUN_CONCRETEART"},
"829":{apItemName:"Assault Rifle - The Concrete Assault Rifle",unlockableId:"FIREARMS_HERO_RIFLE_CONCRETEART"},
"830":{apItemName:"SMG - The Shark SMG",unlockableId:"FIREARMS_HERO_SMG_TAC_SMG_CONCRETEART"},
"831":{apItemName:"Sniper - The Concrete Sniper Rifle",unlockableId:"FIREARMS_HERO_SNIPER_CONCRETEART"},
"832":{apItemName:"Melee - The Concrete Bat",unlockableId:"PROP_MELEE_BASEBALLBAT_CONCRETEART"},
"833":{apItemName:"Suit - The Graffiti Hoody Suit",unlockableId:"TOKEN_OUTFIT_HERO_CONCRETEART"},
"834":{apItemName:"Suit - The Master Freelancer Suit",unlockableId:"EG_MASTERY_SKIN_OUTFIT_HERO_EVERGREENMASTERY"},
"835":{apItemName:"Suit - The Gauze Suit",unlockableId:"EG_MASTERY_SKIN_OUTFIT_HERO_WOUNDED"},
"836":{apItemName:"Suit - The Black Bruiser Suit",unlockableId:"EG_CHALLENGE_SKIN_OUTFIT_HERO_BLOODY"},
"837":{apItemName:"Suit - The Sniper Challange Suit",unlockableId:"SNIPER_CHALLENGE_STARTING_OUTFIT"},
"838":{apItemName:"Suit - Trendy Tourist Suit",unlockableId:"TRAVELLER_CHALLENGE_STARTING_OUTFIT"},
"839":{apItemName:"Pistol - The Ancestral Pistol",unlockableId:"FIREARMS_HERO_PISTOL_KRUGERMEIER_ANCESTRAL"},
"840":{apItemName:"Shotgun - The Ancestral Shotgun",unlockableId:"HUNTING_SHOTGUN_REWARD_DELUXE_ANCESTRAL"},
"841":{apItemName:"Assault Rifle - The Ancestral Assault Rifle",unlockableId:"FIREARMS_HERO_RIFLE_SHASKA_ANCESTRAL"},
"842":{apItemName:"Sniper - The Ancestral Sniper Rifle",unlockableId:"FIREARMS_HERO_SNIPER_ANCESTRAL"},
"843":{apItemName:"Melee - The Ancestral Knife",unlockableId:"PROP_MELEE_COMBAT_KNIFE_ANCESTRAL"},
"844":{apItemName:"Explosive - PROP_DEVICE_REMOTE_EXPLOSIVE_ANCESTRAL",unlockableId:"PROP_DEVICE_REMOTE_EXPLOSIVE_ANCESTRAL"},
"845":{apItemName:"Suit - The Ancestral Hunter Suit",unlockableId:"EG_MASTERY_SKIN_ANCESTRAL_SUIT"},
"846":{apItemName:"Suit - The Ephemeral Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_SB_SUIT"},
"847":{apItemName:"Suit - The Ephemeral Suit with Eye Patch",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_SB_PATCH_SUIT"},
"848":{apItemName:"Poision - Blue Easter Egg",unlockableId:"PROP_MELEE_BLUE_EASTEREGG_PACIFYGAS"},
"849":{apItemName:"Melee - Durian",unlockableId:"PROP_MELEE_DURIAN_EMETICGAS"},
"850":{apItemName:"Melee - Unicorn Horn",unlockableId:"PROP_MELEE_UNICORNHORN"},
"851":{apItemName:"Melee - Pinot Noir",unlockableId:"PROP_MELEE_PINOTNOIR"},
"852":{apItemName:"Explosive - ICA Impact Explosive",unlockableId:"PROP_EXPLOSIVE_ICA_IMPACT"},
"853":{apItemName:"Melee - Burial Dagger",unlockableId:"PROP_MELEE_BURIAL_DAGGER"},
"854":{apItemName:"Shotgun - Golden Sawed-Off Bartoli 12G",unlockableId:"FIREARMS_HERO_SHOTGUN_BARTOLI_12G_SAWED_OFF_GOLDEN"},
"855":{apItemName:"Explosive - Kronstadt Explosive Pen",unlockableId:"PROP_EXPLOSIVE_PEN_SAMBUCA"},
"856":{apItemName:"Explosive - Kronstadt Mini Flash Robo XOI-2900",unlockableId:"PROP_GADGET_ROBOT_FLASH_SAMBUCA"},
"857":{apItemName:"Melee - Kronstadt IOI-1998X Surround Earphones",unlockableId:"PROP_MELEE_BLACK_PHONE_CORD_SAMBUCA"},
"858":{apItemName:"Explosive - The Purple Streak Explosive Duck",unlockableId:"PROP_DEVICE_ICA_RUBBERDUCK_REMOTE_EXPLOSIVE_T"},
"859":{apItemName:"Suit - The Disruptor MMA Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_PEN_FIGHT_SUIT"},
"860":{apItemName:"Suit - The Disruptor Fur Coat",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_PEN_COAT_SUIT"},
"861":{apItemName:"Melee - The Disruptor Resistance Band",unlockableId:"PROP_MELEE_STRENGTHBAND_PENICILLIN"},
"862":{apItemName:"Melee - The Disruptor Kettlebell",unlockableId:"PROP_MELEE_KETTLEBELL_PENICILLIN"},
"863":{apItemName:"Melee - The Disruptor Cane",unlockableId:"PROP_MELEE_CANE_PENICILLIN"},
"864":{apItemName:"Tool - ICA Proximity Micro Taser",unlockableId:"PROP_DEVICE_ICA_MODULAR_PROXIMITY_MICRO_TASER"},
"865":{apItemName:"Tool - Oil Canister",unlockableId:"PROP_DEVICE_EVERGREEN_OILSPILL_CANISTER"},
"866":{apItemName:"Suitcase - The Purple Streak ICA Briefcase",unlockableId:"PROP_CONTAINER_SUITCASE_ICA_T"},
"867":{apItemName:"Tool - RFID Triggered Taser",unlockableId:"PROP_DEVICE_ICA_RFID_COIN_TASER"},
"868":{apItemName:"Tool - Proximity EMP Charge",unlockableId:"PROP_DEVICE_ICA_MODULAR_PROXIMITY_EMP"},
"869":{apItemName:"Explosive - Proximity Lucky Cat Figurine",unlockableId:"PROP_DEVICE_ICA_LUCKYCAT_PROXIMITY_EXPLOSIVE"},
"870":{apItemName:"Pistol - The Purple Streak ICA19 Classic Baller",unlockableId:"FIREARMS_PISTOL_SILVERBALLER_PURPLE"},
"871":{apItemName:"SMG - The Splitter SMG",unlockableId:"FIREARMS_HERO_SMG_HX_10_LAMBIC"},
"872":{apItemName:"Melee - The Splitter Kukri Knife ",unlockableId:"PROP_MELEE_KUKRI_KNIFE_LAMBIC"},
"873":{apItemName:"Melee - The \“Good Quark Vol. 3\” VHS Tape",unlockableId:"PROP_MELEE_VHS_LAMBIC"},
"874":{apItemName:"Suit - The Splitter Boxer Suit",unlockableId:"TOKEN_OUTFIT_LAMBIC_KICKBOXER_REWARD"},
"875":{apItemName:"Suit - The Purple Streak Boxer Suit",unlockableId:"TOKEN_OUTFIT_LAMBIC_KICKBOXER_REWARD_PURPLE"},
"876":{apItemName:"Suit - The Splitter Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_LAMBIC_SUIT"},
"877":{apItemName:"Suit - The Krampus Little Helper Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_CHRISTMAS_SUIT"},
"878":{apItemName:"Distraction - The Purple Streak Coin",unlockableId:"PROP_TOOL_COIN_T"},
"879":{apItemName:"Suit - The Egg Hunt Suit",unlockableId:"TOKEN_OUTFIT_HERO_EASTER_DUCK_SUIT"},
"880":{apItemName:"Pistol - The Cherry Blossom Baller",unlockableId:"FIREARMS_HERO_PISTOL_CHERRYBALLER"},
"881":{apItemName:"Melee - The Sapienza FA-Sanguine Boot",unlockableId:"PROP_MELEE_FOOTBALL_BOOT"},
"882":{apItemName:"Tool - The Golden Wrench",unlockableId:"PROP_TOOL_WRENCH_HANDYMAN_S"},
"883":{apItemName:"Explosive - The Dino Duck",unlockableId:"PROP_DEVICE_ICA_RUBBERDUCK_REMOTE_EXPLOSIVE_GREEN_S"},
"884":{apItemName:"Poision - Red Mushroom",unlockableId:"PROP_POISON_MUSHROOM_EMETIC_S"},
"885":{apItemName:"Suit - The Fire 47 Suit",unlockableId:"TOKEN_OUTFIT_HERO_SUIT_S_WHITE"},
"886":{apItemName:"Suit - The Cerise Suit",unlockableId:"TOKEN_OUTFIT_HERO_SUIT_S_RED"},
"887":{apItemName:"Suit - The Mansion Suit",unlockableId:"TOKEN_OUTFIT_HERO_SUIT_S_GREEN_HAT"},
"888":{apItemName:"Explosive - The Neon Duck",unlockableId:"TOKEN_PROP_DEVICE_RUBBERDUCK_REMOTE_EXPLOSIVE_V"},
"889":{apItemName:"Explosive - The IOI Showcase Duck",unlockableId:"TOKEN_PROP_DEVICE_RUBBERDUCK_REMOTE_EXPLOSIVE_SHOWCASE"},
"890":{apItemName:"Suit - The Purple Streak Swimwear Suit",unlockableId:"TOKEN_OUTFIT_SINGRAY_SWIMWEAR_REWARD_T"},
"891":{apItemName:"Suit - The Pastel Suit",unlockableId:"TOKEN_OUTFIT_HERO_SUMMER_YELLOW_REWARD"},
"892":{apItemName:"Melee - The Purple Streak Fiber Wire",unlockableId:"TOKEN_PROP_MELEE_FIBERWIRE_T"},
"893":{apItemName:"Suit - The Banker King of Cards Suit",unlockableId:"TOKEN_OUTFIT_FRENCHMARTINI_POKER_REWARD"},
"894":{apItemName:"Suit - The Banker Suit",unlockableId:"TOKEN_OUTFIT_REWARD_HERO_FRENCHMARTINI_SUIT"},
"895":{apItemName:"Distraction - The \"Casino Monarchique\" Chip (100.000)",unlockableId:"TOKEN_PROP_TOOL_COIN_POKERCHIP_T"},
"896":{apItemName:"Melee - The Banker Rope",unlockableId:"TOKEN_PROP_MELEE_FIBERWIRE_ROPE"},
"897":{apItemName:"Distraction - The \"Casino Monarchique\" Chip (1.000.000)",unlockableId:"TOKEN_PROP_TOOL_COIN_POKERCHIP_FRENCHMARTINI"},
"898":{apItemName:"Pistol - The Banker Silenced Pistol",unlockableId:"FIREARMS_HERO_PISTOL_HWK_99_FRENCHMARTINI"},
"899":{apItemName:"Explosive - The Party Cracker",unlockableId:"PROP_EXPLOSIVE_FIREWORKS_FLASH"},
"900":{apItemName:"Melee - Cocktail Shaker",unlockableId:"PROP_MELEE_COCKTAILSHAKER"}
}

const unlockablesToKeep:Record<string,Unlockable> = {} // TODO: use less destructive code

const logArchipelago = (msg: string) => {
    log(LogLevel.INFO, msg, logTag)
}

const isLevelUnlocked = (contractId:string) =>{
    return getFlag("Level - "+contractMap[contractId])
}

const getContractFromName = (contractName:string) =>{
    for(const contractId in modifiedContractMap){
        if(modifiedContractMap[contractId] === contractName){
            return contractId
        }
    }
    
    // if nothing was found, try snakecase
    for(const contractId in modifiedContractMap){
        if(modifiedContractMap[contractId].toLowerCase().replaceAll(" ","_") === contractName){
            return contractId
        }
    }

    return "ERROR but cant return undefined otherwise typescript will murder my family"
}


let latestUnlockedLevel = ""

const listOfUnsentChecks:number[] = []
const checkLocation = (id:number) =>{
    if(id != undefined){
        id = id + baseId
        if(!listOfUnsentChecks.includes(id)){
            logArchipelago("Saving id: "+id+" to send")
            listOfUnsentChecks.push(id)
        }else{
            logArchipelago("Id: "+id+" already in list to send-")
        }
    }else{
        logArchipelago("Location check is undefined")
    }
}

const removeUnusedUnlocks = (controller: Controller)=> {
    // ================ DISABLE DEFAULT UNLOCKS ===============
    setFlag("enableMasteryProgression", false)

    const unlockables = controller.configManager.configs.allunlockables

    while(unlockables.length !== 0){
        const lockable = unlockables[unlockables.length-1]

        if(lockable.Type !== "loadoutunlock"&&lockable.Type !== "location"&& lockable.Type !== "package" && lockable.Type !== "evergreenmastery"&&lockable.Subtype!=="hit"&&lockable.Subtype!=="disguise") {
            unlockablesToKeep[lockable.Id]=lockable
        }

        unlockables.pop();
    }

    //H2 compliance test:
    const h2unlockables = controller.configManager.configs.H2allunlockables
    while(h2unlockables.length !== 0){
        h2unlockables.pop()
    }
}
const addModifiedMissions = (controller: Controller, difficulty: string) => {
    // add copy of contracts to the game  
    let eightDigitSeed = currentSeed.slice(0,8)
    eightDigitSeed = eightDigitSeed.padEnd(8,"0")     
    for (const contractId in contractMap){
        const contract = controller.resolveContract(contractId, "h3")
        if(contract === undefined){
            log(LogLevel.ERROR, "No contract fetched for level "+contractMap[contractId],logTag)
            continue;
        }
        // remove difficulties not set by archipelago
        let savedDifficulty
                
        if(contract.Data.GameDifficulties !== undefined){
            for (const i in contract.Data.GameDifficulties){
                if(contract.Data.GameDifficulties[i].Difficulty === difficulty){
                    savedDifficulty = contract.Data.GameDifficulties[i]
                    break
                }
            }
                    
            if(savedDifficulty !== undefined){
                contract.Data.GameDifficulties = [savedDifficulty]
            }else{
                log(LogLevel.ERROR, "No difficulty was saved for level "+contractMap[contractId],logTag)
            }
        }    


        let newContractId = eightDigitSeed+"-0000-0000-0000-"+contractId.split("-")[4]
        modifiedContractMap[newContractId] = contractMap[contractId]  
        contract.Metadata.Id = newContractId

        controller.addMission(contract); 
    }
}
let collectedContractPieces = 0
let contractGoalAmount = ""
const handleRecivedItems = (controller: Controller, itemIds: number[]) => {
    let errorOccured = false
    for(const i in itemIds){
        const id = itemIds[i] - baseId
        
        if (apItemMap[id] === undefined){
            if(id === 1000){ // exception for Contract Pieces
                collectedContractPieces++;

                configs.EiderDashboard.children.$mergearrays[5].data.title = "Contract Collection "+collectedContractPieces+"/"+contractGoalAmount

                configs.EiderDashboard.children.$mergearrays[5].actions.select["replace-children"].children[0].data.title = "Contract Collection "+collectedContractPieces+"/"+contractGoalAmount

                continue;
            } 
            log(LogLevel.ERROR,"Recived ItemId "+id+" is not in ItemMap!",logTag)
            errorOccured = true
            continue
        }
        const itemName = apItemMap[id].apItemName
    
        if(itemName.startsWith("Level -")){
            logArchipelago("Setting Flag: " + itemName)
    
            setFlag(itemName, true)
    
            latestUnlockedLevel = getContractFromName(itemName.split("Level - ")[1])
                // TODO: somehow force update the menu and campaign
        }else{
            logArchipelago("Awarded Unlockable: "+apItemMap[id].unlockableId)
            controller.configManager.configs.allunlockables.push(unlockablesToKeep[apItemMap[id].unlockableId])

            controller.configManager.configs.H2allunlockables.push(unlockablesToKeep[apItemMap[id].unlockableId])
            clearInventoryCache()
        }
    }
    return !errorOccured
}

module.exports = function archipelagoCampaign(controller: Controller) {
    logArchipelago("Plugin Loading.")
    removeUnusedUnlocks(controller)

    // ================ SETUP LEVEL FLAGS ================
    for (const contractId in contractMap){
        setFlag("Level - "+contractMap[contractId], false)
    }
    // =============== SETUP CLIENT ENDPOINTS ============
    webFeaturesRouter.get("/archipelago",(req,res)=>{
        res.contentType("text").send("OK")
    })
    webFeaturesRouter.post("/archipelago/sendItems", (req,res)=>{
        const itemIds: number[] = JSON.parse(req.query.items) 
        const worked = handleRecivedItems(controller, itemIds)

        if(worked) {
            res.status(200).send()
        }else{
            res.status(500).contentType("text").send("Error while recieving item, see console for details")
        }
    })
    webFeaturesRouter.get("/archipelago/setDifficulty/:difficulty/:seed", (req,res)=>{
        const difficulty = req.params.difficulty
        currentSeed = req.params.seed

        collectedContractPieces = 0
        controller.configManager.configs.allunlockables.splice(0, controller.configManager.configs.allunlockables.length)
        clearInventoryCache()
        for (const contractId in contractMap){
            setFlag("Level - "+contractMap[contractId], false)
        }   
        modifiedContractMap = {}
         
        addModifiedMissions(controller, difficulty)
        res.status(200).send()
    })
    webFeaturesRouter.get("/archipelago/checks", (req,res) =>{
        res.status(200).contentType("json").send(listOfUnsentChecks)

        while(listOfUnsentChecks.length != 0){
            listOfUnsentChecks.pop()
        }
    })
    webFeaturesRouter.get("/archipelago/setGoal/:goalMode/:goalDetails/:moreGoalDetails",(req,res)=>{
        if(req.params.goalMode === "contract_collection"){
            contractGoalAmount = req.params.goalDetails

            configs.EiderDashboard.children.$mergearrays[5].data.title = "Contract Collection "+collectedContractPieces+"/"+contractGoalAmount

            configs.EiderDashboard.children.$mergearrays[5].actions.select["replace-children"].children[0].data.title = "Contract Collection "+collectedContractPieces+"/"+contractGoalAmount

            configs.EiderDashboard.children.$mergearrays[5].data.image = "$res images/challenges/Wet/Rat_KillThePast.jpg"
            res.status(200).send()
        }else if(req.params.goalMode === "level_completion"){

            configs.EiderDashboard.children.$mergearrays[5].data.title = "Goal Level: "+req.params.goalDetails+" ("+req.params.moreGoalDetails.replaceAll("_"," ")+")"

            configs.EiderDashboard.children.$mergearrays[5].actions.select["replace-children"].children[0].data.title = "Goal Level: "+req.params.goalDetails+" ("+req.params.moreGoalDetails.replaceAll("_"," ")+")"

            configs.EiderDashboard.children.$mergearrays[5].data.image = "$res "+controller.resolveContract(getContractFromName(req.params.goalDetails), "h3")!.Metadata.TileImage;

            res.status(200).send()
        }else{
            log(LogLevel.ERROR, "Archipelago Client tried to set unknown goal Mode: "+req.params.goalMode,logTag)
            res.status(200).send("Invalid goal mode")
        }
    })

    // =============== COSMETICS ==================
    // TODO: everything here assumes constant order in the jsons, which I am unsure how consistent it is
    
    // replace Freelancer with goal (or elusive targets in H2)
    configs.EiderDashboard.children.$mergearrays[5].data = {
        "title": "NO GOAL LOADED",
        "header": "Current Goal Progress",
        "icon": "54",
        "image": "$res images/challenges/hokkaido/snowcrane_opp_sabotage_mainframe.jpg"
    }
    configs.EiderDashboard.children.$mergearrays[5].actions!.select = {
        "replace-children": {
            "target": "headline_container",
            "children": [
                {
                    "view": "menu3.basic.HeadlineElement",
                    "selectable": false,
                    "pressable": false,
                    "data": {
                        "header": "Current Goal Progress",
                        "title": "NO GOAL LOADED",
                        "typeicon": "54"
                    }
                }
            ]
        }
    }
    configs.EiderDashboard.children.$mergearrays[5].actions!.accept = {}
    configs.EiderDashboard.children.$mergearrays[5].actions!.actiony = {}
    configs.H2DashboardTemplate.children.$mergearrays.pop() 
    // Replace escalations with HITMAPS attribution
    configs.EiderDashboard.children.$mergearrays[4].data = {
        "title": "HITMAPS",
        "header": "Item information provided by",
        "icon": "story",
        "image": "$res images/challenges/marrakech/story_evacuation_spider.jpg"
    }
    configs.H2DashboardTemplate.children.$mergearrays[4].data = {
        "title": "HITMAPS",
        "header": "Item information provided by",
        "icon": "story",
        "image": "$res images/challenges/marrakech/story_evacuation_spider.jpg"
    }
    configs.EiderDashboard.children.$mergearrays[4].actions!.accept = {
        "open-url": {
            "url": "https://www.hitmaps.com/"
        }
    }
    configs.H2DashboardTemplate.children.$mergearrays[4].actions!.accept = {
        "open-url": {
            "url": "https://www.hitmaps.com/"
        }
    }
    configs.EiderDashboard.children.$mergearrays[4].actions!.select = {
        "replace-children": {
            "target": "headline_container",
            "children": [
                {
                    "view": "menu3.basic.HeadlineElement",
                    "selectable": false,
                    "pressable": false,
                    "data": {
                        "header": "Item information provided by",
                        "title": "HITMAPS",
                        "typeicon": "story"
                    }
                }
            ]
        }
    }
    configs.H2DashboardTemplate.children.$mergearrays[4].actions!.select = {
        "replace-children": {
            "target": "headline_container",
            "children": [
                {
                    "view": "menu3.basic.HeadlineElement",
                    "selectable": false,
                    "pressable": false,
                    "data": {
                        "header": "Item information provided by",
                        "title": "HITMAPS",
                        "typeicon": "story"
                    }
                }
            ]
        }
    }

    // Remove other Gamemodes from topbar (Arcade, Contracts and Freelancer would mess with itemsanity)
    configs.HubPageData.$datacontext.do.children[5].children!.splice(3,1) 
    
    // Remove destinations (removing the destination tab itself is forbidden per HubPageData.json:222)
    // @ts-expect-error Jwt props.
    menuDataRouter.get("/Hub", (req: RequestWithJwt, res) => {
        const hubInfo = getHubData(req.gameVersion, req.jwt.unique_name)
        
        hubInfo.DestinationsData.splice(0,hubInfo.DestinationsData.length)

        let template: unknown

        if (req.gameVersion === "h3" || req.gameVersion === "h2") {
            template = null
        } else {
            // scpc hub will need to be contributed by a plugin
            template = getVersionedConfig("HubTemplate", req.gameVersion, false)
        }

        res.json({
            template,
            data: hubInfo,
        })
    })
    menuDataRouter.stack.unshift(menuDataRouter.stack.pop()!);

    // =============== CAMPAIGN SETUP ==================
    controller.hooks.contributeCampaigns.tap("addArchipelagoCampaign",
        (
            campaigns: Campaign[],
            genSingleMissionFunc: GenSingleMissionFunc,
            genSingleVideoFunc: GenSingleVideoFunc,
            gameVersion: GameVersion,
        ) => {
            const myStoryData = []
            
            for (const contractId in modifiedContractMap) {
                if (getFlag("Level - "+modifiedContractMap[contractId])){
                    myStoryData.push(
                        genSingleMissionFunc(contractId, gameVersion)
                    )
                }
            }

            const campaignTemplate = {
                BackgroundImage: "images/challenges/profile_challenges/escalation_s2_tier_10.jpg",
                Image: "images/challenges/profile_challenges/escalation_s2_tier_10.jpg",
                Name: "Archipelago",
                Type: "campaign",
                Properties: {
                    BackgroundImage: "images/challenges/profile_challenges/escalation_s2_tier_10.jpg",
                },
                StoryData: myStoryData, // Only add unlocked missions
            }
            if(gameVersion == "h2"){
                campaignTemplate.BackgroundImage = "Images/Challenges/profile_challenges/classics_location_normal.jpg"
            }

            // Remove all other campaigns
            while (campaigns.length !== 0) {
                campaigns.pop()
            }

            campaigns.push(campaignTemplate)
        }
    )
    controller.hooks.getNextCampaignMission.tap("setNextCampaignToLatestUnlocked",
        (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _contractId: string,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _gameVersion: GameVersion,
        ): PlayNextGetCampaignsHookReturn | undefined => {
            return {
                nextContractId: latestUnlockedLevel,
                campaignDetails: {
                    CampaignName: "Archipelago",
                    ParentCampaignName: undefined,
                },
                overrideIndex:0
            }
        }
    )
    controller.hooks.newEvent.tap("awardCheckOnItemPickup",(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event: ClientToServerEvent<any>
        , details: {
            gameVersion: GameVersion;
            userId: string;
        }, session: ContractSession
        )=>{
            if(event.Name === "ItemPickedUp"){
                if(modifiedContractMap[session.contractId]!=undefined){
                    logArchipelago("Sending check for "+event.Value.ItemName +";"+event.Value.RepositoryId+";"+itemDepotToApIdMap[event.Value.RepositoryId])
                    checkLocation(itemDepotToApIdMap[event.Value.RepositoryId])
                }else{
                    log(LogLevel.ERROR,"Save from diffrent Archipelago Seed was loaded, not sending check "+event.Value.ItemName)
                }
            }      
        }
    )


    // send completed mission checks
    controller.hooks.onMissionEnd.tap("awardCheckOnCompletedMission", (contractSession) => {

        const levelName = modifiedContractMap[contractSession.contractId]
        log(LogLevel.DEBUG,"Completed "+levelName, logTag)
        checkLocation(locationNameToApIdMap[levelName + " Completed"])
       
        if(contractSession.silentAssassinLost===false){
            logArchipelago("Completed "+levelName+" as SA")
            checkLocation(locationNameToApIdMap[levelName + " Completed - Silent Assassin"])
        }

        // disgusesUsed returns {} no matter the contents, so I assume default suit is included
        if(contractSession.disguisesUsed.size === 1){
            logArchipelago("Completed "+levelName+" as SO")
            checkLocation(locationNameToApIdMap[levelName + " Completed - Suit Only"])
        }

        if(contractSession.silentAssassinLost===false && contractSession.disguisesUsed.size === 1 && true){ 
            logArchipelago("Completed "+levelName+" as SASO")
            checkLocation(locationNameToApIdMap[levelName + " Completed - Silent Assassin, Suit Only"])
        }

    })

    logArchipelago("Plugin Loaded.")
}