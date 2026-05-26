export type CardCategory = "Core Psyduck" | "Psyduck Cameo" | "Other Purchase";
export type CardStatus = "Owned" | "Need to Buy";
export type CardPhase =
  | "Phase 1 - Cheap Modern Base"
  | "Phase 2 - Vintage & Trainer Psyducks"
  | "Phase 3 - Mid-Era Core Psyducks"
  | "Phase 4 - Modern Illustration Rares"
  | "Phase 5 - GX / Promo / Chase Cards"
  | "Phase 6 - Cameos / Hidden Ducks"
  | "Phase 7 - Optional Variants & Side Purchases";

export type PsyduckCard = {
  id: string;
  name: string;
  set: string;
  number?: string;
  category: CardCategory;
  phase: CardPhase;
  status: CardStatus;
  variant?: string;
  rarity?: string;
  lowPrice?: number;
  marketPrice?: number;
  targetPrice?: number;
  notes?: string;
  tcgplayerSearchUrl: string;
  imageUrl?: string;
};

export function tcgSearch(query: string) {
  return `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(query)}&view=grid`;
}

export const collectionPhases: CardPhase[] = [
  "Phase 1 - Cheap Modern Base",
  "Phase 2 - Vintage & Trainer Psyducks",
  "Phase 3 - Mid-Era Core Psyducks",
  "Phase 4 - Modern Illustration Rares",
  "Phase 5 - GX / Promo / Chase Cards",
  "Phase 6 - Cameos / Hidden Ducks",
  "Phase 7 - Optional Variants & Side Purchases",
];

export const phaseRank = new Map(
  collectionPhases.map((phase, index) => [phase, index])
);

export const ownedPsyduckCards: PsyduckCard[] = [
  {
    id: "psyduck-fossil-53-1st-edition",
    name: "Psyduck",
    set: "Fossil",
    number: "53/62",
    category: "Core Psyduck",
    phase: "Phase 2 - Vintage & Trainer Psyducks",
    status: "Owned",
    variant: "1st Edition",
    lowPrice: 6.0,
    marketPrice: 13.25,
    targetPrice: 49.99,
    notes: "First English Psyduck card variant. Key collection piece.",
    tcgplayerSearchUrl: tcgSearch("Psyduck Fossil 53/62 1st Edition"),
  },
  {
    id: "psyduck-fossil-53-unlimited",
    name: "Psyduck",
    set: "Fossil",
    number: "53/62",
    category: "Core Psyduck",
    phase: "Phase 2 - Vintage & Trainer Psyducks",
    status: "Owned",
    variant: "Unlimited",
    lowPrice: 0.19,
    marketPrice: 1.2,
    targetPrice: 96.95,
    notes: "First English Psyduck card, unlimited version.",
    tcgplayerSearchUrl: tcgSearch("Psyduck Fossil 53/62 Unlimited"),
  },
  {
    id: "psyduck-team-rocket-65-unlimited",
    name: "Psyduck",
    set: "Team Rocket",
    number: "65/82",
    category: "Core Psyduck",
    phase: "Phase 2 - Vintage & Trainer Psyducks",
    status: "Owned",
    variant: "Unlimited",
    lowPrice: 0.25,
    marketPrice: 1.0,
    targetPrice: 19.96,
    tcgplayerSearchUrl: tcgSearch("Psyduck Team Rocket 65/82"),
  },
  {
    id: "psyduck-breakpoint-16",
    name: "Psyduck",
    set: "XY - BREAKpoint",
    number: "16/122",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    lowPrice: 0.1,
    marketPrice: 0.75,
    targetPrice: 19.98,
    tcgplayerSearchUrl: tcgSearch("Psyduck BREAKpoint 16/122"),
  },
  {
    id: "psyduck-sun-moon-28",
    name: "Psyduck",
    set: "SM Base Set",
    number: "28/149",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    lowPrice: 0.12,
    marketPrice: 0.54,
    targetPrice: 19.98,
    tcgplayerSearchUrl: tcgSearch("Psyduck Sun Moon 28/149"),
  },
  {
    id: "psyduck-team-up-26",
    name: "Psyduck",
    set: "SM - Team Up",
    number: "26/181",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    lowPrice: 0.11,
    marketPrice: 0.62,
    targetPrice: 19.98,
    tcgplayerSearchUrl: tcgSearch("Psyduck Team Up 26/181"),
  },
  {
    id: "psyduck-detective-pikachu-7",
    name: "Psyduck",
    set: "Detective Pikachu",
    number: "7/18",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    variant: "Holofoil",
    lowPrice: 0.2,
    marketPrice: 0.77,
    targetPrice: 4.99,
    tcgplayerSearchUrl: tcgSearch("Psyduck Detective Pikachu 7/18"),
  },
  {
    id: "psyduck-hidden-fates-11",
    name: "Psyduck",
    set: "Hidden Fates",
    number: "11/68",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    lowPrice: 0.1,
    marketPrice: 0.3,
    targetPrice: 5.0,
    tcgplayerSearchUrl: tcgSearch("Psyduck Hidden Fates 11/68"),
  },
  {
    id: "psyduck-cosmic-eclipse-40",
    name: "Psyduck",
    set: "SM - Cosmic Eclipse",
    number: "40/236",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    lowPrice: 0.5,
    marketPrice: 1.89,
    targetPrice: 39.71,
    tcgplayerSearchUrl: tcgSearch("Psyduck Cosmic Eclipse 40/236"),
  },
  {
    id: "psyduck-evolving-skies-24",
    name: "Psyduck",
    set: "SWSH07: Evolving Skies",
    number: "024/203",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    lowPrice: 0.03,
    marketPrice: 0.25,
    targetPrice: 1000.27,
    tcgplayerSearchUrl: tcgSearch("Psyduck Evolving Skies 024/203"),
  },
  {
    id: "psyduck-astral-radiance-28",
    name: "Psyduck",
    set: "SWSH10: Astral Radiance",
    number: "028/189",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    lowPrice: 0.01,
    marketPrice: 0.24,
    targetPrice: 1000.28,
    notes: "Potential bulk-hoard Psyduck King card.",
    tcgplayerSearchUrl: tcgSearch("Psyduck Astral Radiance 028/189"),
  },
  {
    id: "psyduck-151-054-reverse",
    name: "Psyduck",
    set: "SV: Scarlet & Violet 151",
    number: "054/165",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    variant: "Reverse Holofoil",
    lowPrice: 0.12,
    marketPrice: 0.4,
    targetPrice: 99.0,
    notes:
      "Favorite bulk-buy target. Consider tracking regular and reverse holo separately.",
    tcgplayerSearchUrl: tcgSearch(
      "Psyduck 054/165 Scarlet Violet 151 Reverse Holo"
    ),
  },
  {
    id: "mistys-psyduck-destined-rivals-045",
    name: "Misty's Psyduck",
    set: "SV10: Destined Rivals",
    number: "045/182",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    lowPrice: 0.01,
    marketPrice: 0.27,
    targetPrice: 19.98,
    tcgplayerSearchUrl: tcgSearch("Misty's Psyduck Destined Rivals 045/182"),
  },
  {
    id: "psyduck-ascended-heroes-039-love-ball-rh",
    name: "Psyduck",
    set: "ME: Ascended Heroes",
    number: "039/217",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    variant: "Love Ball Reverse Holofoil",
    lowPrice: 0.1,
    marketPrice: 0.85,
    targetPrice: 27.1,
    tcgplayerSearchUrl: tcgSearch("Psyduck 039/217 Ascended Heroes Love Ball"),
  },
  {
    id: "psyduck-ascended-heroes-039-energy-rh",
    name: "Psyduck",
    set: "ME: Ascended Heroes",
    number: "039/217",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Owned",
    variant: "Energy Symbol Pattern Reverse Holofoil",
    lowPrice: 0.15,
    marketPrice: 0.5,
    targetPrice: 19.98,
    tcgplayerSearchUrl: tcgSearch(
      "Psyduck 039/217 Ascended Heroes Energy Symbol Pattern"
    ),
  },
  {
    id: "psyduck-ascended-heroes-226",
    name: "Psyduck",
    set: "ME: Ascended Heroes",
    number: "226/217",
    category: "Core Psyduck",
    phase: "Phase 4 - Modern Illustration Rares",
    status: "Owned",
    variant: "Holofoil / Illustration Rare",
    lowPrice: 95.5,
    marketPrice: 122.91,
    targetPrice: 9999.0,
    notes: "Current centerpiece card.",
    tcgplayerSearchUrl: tcgSearch("Psyduck 226/217 Ascended Heroes"),
  },
  {
    id: "mistys-wrath-gym-heroes-114",
    name: "Misty's Wrath",
    set: "Gym Heroes",
    number: "114/132",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Owned",
    variant: "Unlimited",
    lowPrice: 3.99,
    marketPrice: 5.5,
    targetPrice: 52.96,
    notes: "Psyduck cameo / Misty connection.",
    tcgplayerSearchUrl: tcgSearch("Misty's Wrath Gym Heroes 114/132"),
  },
  {
    id: "sabrinas-psychic-control-gym-challenge-121",
    name: "Sabrina's Psychic Control",
    set: "Gym Challenge",
    number: "121/132",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Owned",
    variant: "Unlimited",
    lowPrice: 2.85,
    marketPrice: 4.0,
    targetPrice: 250.0,
    notes: "Psyduck cameo.",
    tcgplayerSearchUrl: tcgSearch(
      "Sabrina's Psychic Control Gym Challenge 121/132"
    ),
  },
  {
    id: "farfetchd-team-up-127",
    name: "Farfetch'd",
    set: "SM - Team Up",
    number: "127/181",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Owned",
    lowPrice: 0.15,
    marketPrice: 0.36,
    targetPrice: 19.98,
    notes: "Psyduck appears in the artwork.",
    tcgplayerSearchUrl: tcgSearch("Farfetch'd Team Up 127/181 Psyduck"),
  },
  {
    id: "floette-cosmic-eclipse-151",
    name: "Floette",
    set: "SM - Cosmic Eclipse",
    number: "151/236",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Owned",
    lowPrice: 0.25,
    marketPrice: 0.57,
    targetPrice: 19.86,
    notes: "Psyduck appears in the artwork.",
    tcgplayerSearchUrl: tcgSearch("Floette Cosmic Eclipse 151/236 Psyduck"),
  },
  {
    id: "wiglett-sv-base-206",
    name: "Wiglett",
    set: "SV01: Scarlet & Violet Base Set",
    number: "206/198",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Owned",
    variant: "Holofoil / Illustration Rare",
    lowPrice: 32.97,
    marketPrice: 40.0,
    targetPrice: 9999.0,
    notes: "Modern Psyduck cameo.",
    tcgplayerSearchUrl: tcgSearch("Wiglett 206/198 Scarlet Violet Psyduck"),
  },
  {
    id: "pikachu-151-173",
    name: "Pikachu",
    set: "SV: Scarlet & Violet 151",
    number: "173/165",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Owned",
    variant: "Holofoil / Illustration Rare",
    lowPrice: 76.77,
    marketPrice: 100.0,
    targetPrice: 10000.0,
    notes: "Popular 151 illustration rare with Psyduck in the scene.",
    tcgplayerSearchUrl: tcgSearch("Pikachu 173/165 Scarlet Violet 151 Psyduck"),
  },
  {
    id: "clive-paldean-fates-236",
    name: "Clive",
    set: "SV: Paldean Fates",
    number: "236/091",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Owned",
    variant: "Holofoil / SIR",
    lowPrice: 24.09,
    marketPrice: 32.4,
    targetPrice: 166.94,
    notes: "Modern Psyduck cameo.",
    tcgplayerSearchUrl: tcgSearch("Clive 236/091 Paldean Fates Psyduck"),
  },
  {
    id: "chansey-twilight-masquerade-187",
    name: "Chansey",
    set: "SV06: Twilight Masquerade",
    number: "187/167",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Owned",
    variant: "Holofoil / Illustration Rare",
    lowPrice: 61.54,
    marketPrice: 78.97,
    targetPrice: 999.0,
    notes: "Modern Psyduck cameo.",
    tcgplayerSearchUrl: tcgSearch(
      "Chansey 187/167 Twilight Masquerade Psyduck"
    ),
  },
  {
    id: "rhydon-jungle-unlimited",
    name: "Rhydon",
    set: "Jungle",
    category: "Other Purchase",
    phase: "Phase 7 - Optional Variants & Side Purchases",
    status: "Owned",
    variant: "Unlimited",
    lowPrice: 0.24,
    marketPrice: 0.75,
    targetPrice: 45.46,
    tcgplayerSearchUrl: tcgSearch("Rhydon Jungle Unlimited"),
  },
  {
    id: "mistys-water-command-hidden-fates",
    name: "Misty's Water Command",
    set: "Hidden Fates",
    category: "Other Purchase",
    phase: "Phase 7 - Optional Variants & Side Purchases",
    status: "Owned",
    variant: "Holofoil",
    lowPrice: 0.49,
    marketPrice: 1.0,
    targetPrice: 19.58,
    notes:
      "Related Misty card, not treated as a confirmed Psyduck cameo unless verified.",
    tcgplayerSearchUrl: tcgSearch("Misty's Water Command Hidden Fates"),
  },
];

export const needToBuyCorePsyduckCards: PsyduckCard[] = [
  {
    id: "psyduck-mega-evolution-promos-007",
    name: "Psyduck",
    set: "Mega Evolution Promos",
    number: "007",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 9.77,
    notes: "Promo.",
    tcgplayerSearchUrl: tcgSearch("Psyduck Mega Evolution Promos 007"),
  },
  {
    id: "mistys-psyduck-destined-rivals-193",
    name: "Misty's Psyduck",
    set: "Destined Rivals",
    number: "193/182",
    category: "Core Psyduck",
    phase: "Phase 4 - Modern Illustration Rares",
    status: "Need to Buy",
    marketPrice: 80.0,
    notes: "Modern chase / illustration rare.",
    tcgplayerSearchUrl: tcgSearch("Misty's Psyduck 193/182 Destined Rivals"),
  },
  {
    id: "psyduck-151-054-regular",
    name: "Psyduck",
    set: "Scarlet & Violet 151",
    number: "054/165",
    category: "Core Psyduck",
    phase: "Phase 1 - Cheap Modern Base",
    status: "Need to Buy",
    variant: "Regular",
    marketPrice: 0.22,
    notes: "Regular copy. User owns reverse holo already.",
    tcgplayerSearchUrl: tcgSearch("Psyduck 054/165 Scarlet Violet 151"),
  },
  {
    id: "psyduck-151-175",
    name: "Psyduck",
    set: "Scarlet & Violet 151",
    number: "175/165",
    category: "Core Psyduck",
    phase: "Phase 4 - Modern Illustration Rares",
    status: "Need to Buy",
    variant: "Illustration Rare",
    marketPrice: 82.98,
    notes: "Major modern Psyduck chase.",
    tcgplayerSearchUrl: tcgSearch("Psyduck 175/165 Scarlet Violet 151"),
  },
  {
    id: "slowpoke-psyduck-gx-35",
    name: "Slowpoke & Psyduck-GX",
    set: "Unified Minds",
    number: "35/236",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 98.24,
    notes: "Tag Team GX.",
    tcgplayerSearchUrl: tcgSearch("Slowpoke & Psyduck GX 35/236 Unified Minds"),
  },
  {
    id: "slowpoke-psyduck-gx-217",
    name: "Slowpoke & Psyduck-GX",
    set: "Unified Minds",
    number: "217/236",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 126,
    notes: "Full art Tag Team GX.",
    tcgplayerSearchUrl: tcgSearch(
      "Slowpoke & Psyduck GX 217/236 Unified Minds"
    ),
  },
  {
    id: "slowpoke-psyduck-gx-218",
    name: "Slowpoke & Psyduck-GX",
    set: "Unified Minds",
    number: "218/236",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 293,
    notes: "High-dollar chase.",
    tcgplayerSearchUrl: tcgSearch(
      "Slowpoke & Psyduck GX 218/236 Unified Minds"
    ),
  },
  {
    id: "slowpoke-psyduck-gx-239",
    name: "Slowpoke & Psyduck-GX",
    set: "Unified Minds",
    number: "239/236",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 158,
    notes: "Rainbow rare.",
    tcgplayerSearchUrl: tcgSearch(
      "Slowpoke & Psyduck GX 239/236 Unified Minds"
    ),
  },
  {
    id: "psyduck-mcdonalds-2018-2",
    name: "Psyduck",
    set: "McDonald's Collection 2018",
    number: "2/12",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 64.43,
    notes: "Promo / specialty release.",
    tcgplayerSearchUrl: tcgSearch("Psyduck McDonald's Collection 2018 2/12"),
  },
  {
    id: "psyduck-sm199",
    name: "Psyduck",
    set: "Sun & Moon Promos",
    number: "SM199",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 8.07,
    tcgplayerSearchUrl: tcgSearch("Psyduck SM199"),
  },
  {
    id: "psyduck-boundaries-crossed-32",
    name: "Psyduck",
    set: "Boundaries Crossed",
    number: "32/149",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 9.37,
    tcgplayerSearchUrl: tcgSearch("Psyduck Boundaries Crossed 32/149"),
  },
  {
    id: "psyduck-boundaries-crossed-33",
    name: "Psyduck",
    set: "Boundaries Crossed",
    number: "33/149",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 5.4,
    tcgplayerSearchUrl: tcgSearch("Psyduck Boundaries Crossed 33/149"),
  },
  {
    id: "psyduck-triumphant-74",
    name: "Psyduck",
    set: "Triumphant",
    number: "74/102",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 14.92,
    tcgplayerSearchUrl: tcgSearch("Psyduck Triumphant 74/102"),
  },
  {
    id: "psyduck-platinum-87",
    name: "Psyduck",
    set: "Platinum",
    number: "87/127",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 21.64,
    tcgplayerSearchUrl: tcgSearch("Psyduck Platinum 87/127"),
  },
  {
    id: "psyduck-secret-wonders-100",
    name: "Psyduck",
    set: "Secret Wonders",
    number: "100/132",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 8.67,
    tcgplayerSearchUrl: tcgSearch("Psyduck Secret Wonders 100/132"),
  },
  {
    id: "psyduck-ex-holon-phantoms-81",
    name: "Psyduck",
    set: "EX Holon Phantoms",
    number: "81/110",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 19.8,
    tcgplayerSearchUrl: tcgSearch("Psyduck EX Holon Phantoms 81/110"),
  },
  {
    id: "psyduck-ex-team-rocket-returns-70",
    name: "Psyduck",
    set: "EX Team Rocket Returns",
    number: "70/109",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 27.82,
    tcgplayerSearchUrl: tcgSearch("Psyduck EX Team Rocket Returns 70/109"),
  },
  {
    id: "psyduck-ex-team-magma-vs-team-aqua-44",
    name: "Psyduck",
    set: "EX Team Magma vs Team Aqua",
    number: "44/95",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 26.28,
    tcgplayerSearchUrl: tcgSearch("Psyduck EX Team Magma vs Team Aqua 44/95"),
  },
  {
    id: "psyduck-ex-sandstorm-73",
    name: "Psyduck",
    set: "EX Sandstorm",
    number: "73/100",
    category: "Core Psyduck",
    phase: "Phase 3 - Mid-Era Core Psyducks",
    status: "Need to Buy",
    marketPrice: 15.74,
    tcgplayerSearchUrl: tcgSearch("Psyduck EX Sandstorm 73/100"),
  },
  {
    id: "psyduck-aquapolis-104",
    name: "Psyduck",
    set: "Aquapolis",
    number: "104/147",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 143,
    notes: "Expensive older card.",
    tcgplayerSearchUrl: tcgSearch("Psyduck Aquapolis 104/147"),
  },
  {
    id: "psyduck-legendary-collection-88",
    name: "Psyduck",
    set: "Legendary Collection",
    number: "88/110",
    category: "Core Psyduck",
    phase: "Phase 2 - Vintage & Trainer Psyducks",
    status: "Need to Buy",
    marketPrice: 6.95,
    tcgplayerSearchUrl: tcgSearch("Psyduck Legendary Collection 88/110"),
  },
  {
    id: "psyduck-neo-destiny-79",
    name: "Psyduck",
    set: "Neo Destiny",
    number: "79/105",
    category: "Core Psyduck",
    phase: "Phase 2 - Vintage & Trainer Psyducks",
    status: "Need to Buy",
    marketPrice: 21.02,
    tcgplayerSearchUrl: tcgSearch("Psyduck Neo Destiny 79/105"),
  },
  {
    id: "mistys-psyduck-gym-challenge-90",
    name: "Misty's Psyduck",
    set: "Gym Challenge",
    number: "90/132",
    category: "Core Psyduck",
    phase: "Phase 2 - Vintage & Trainer Psyducks",
    status: "Need to Buy",
    marketPrice: 6.59,
    tcgplayerSearchUrl: tcgSearch("Misty's Psyduck Gym Challenge 90/132"),
  },
  {
    id: "sabrinas-psyduck-gym-challenge-99",
    name: "Sabrina's Psyduck",
    set: "Gym Challenge",
    number: "99/132",
    category: "Core Psyduck",
    phase: "Phase 2 - Vintage & Trainer Psyducks",
    status: "Need to Buy",
    marketPrice: 9.28,
    tcgplayerSearchUrl: tcgSearch("Sabrina's Psyduck Gym Challenge 99/132"),
  },
  {
    id: "mistys-psyduck-gym-heroes-54",
    name: "Misty's Psyduck",
    set: "Gym Heroes",
    number: "54/132",
    category: "Core Psyduck",
    phase: "Phase 2 - Vintage & Trainer Psyducks",
    status: "Need to Buy",
    marketPrice: 6.91,
    tcgplayerSearchUrl: tcgSearch("Misty's Psyduck Gym Heroes 54/132"),
  },
  {
    id: "psyduck-wotc-promo-20",
    name: "Psyduck",
    set: "Wizards of the Coast Promos",
    number: "20",
    category: "Core Psyduck",
    phase: "Phase 5 - GX / Promo / Chase Cards",
    status: "Need to Buy",
    marketPrice: 75.43,
    tcgplayerSearchUrl: tcgSearch("Psyduck Wizards of the Coast Promo 20"),
  },
  {
    id: "psyduck-topps-series-1-54",
    name: "Psyduck",
    set: "Topps Series 1",
    number: "54",
    category: "Core Psyduck",
    phase: "Phase 7 - Optional Variants & Side Purchases",
    status: "Need to Buy",
    notes: "Optional non-standard card.",
    tcgplayerSearchUrl: tcgSearch("Psyduck Topps Series 1 54"),
  },
];

export const needToBuyCameoCards: PsyduckCard[] = [
  {
    id: "slowking-southern-islands-14",
    name: "Slowking",
    set: "Southern Islands",
    number: "14",
    category: "Psyduck Cameo",
    phase: "Phase 6 - Cameos / Hidden Ducks",
    status: "Need to Buy",
    notes: "Classic Psyduck cameo target.",
    tcgplayerSearchUrl: tcgSearch("Slowking Southern Islands 14 Psyduck"),
  },
  {
    id: "champions-festival-psyduck-cameo",
    name: "Champions Festival",
    set: "World Championships Promos",
    category: "Psyduck Cameo",
    phase: "Phase 7 - Optional Variants & Side Purchases",
    status: "Need to Buy",
    notes: "Optional trophy/event cameo. Very expensive; track later.",
    tcgplayerSearchUrl: tcgSearch("Champions Festival Psyduck"),
  },
  {
    id: "paradise-resort-psyduck-cameo",
    name: "Paradise Resort",
    set: "World Championships Promos",
    category: "Psyduck Cameo",
    phase: "Phase 7 - Optional Variants & Side Purchases",
    status: "Need to Buy",
    notes: "Optional trophy/event cameo. Very expensive; track later.",
    tcgplayerSearchUrl: tcgSearch("Paradise Resort Psyduck"),
  },
  {
    id: "tropical-psyduck-cameo",
    name: "Tropical Wind / Tropical Beach / Tropical Tidal Wave",
    set: "Tropical / Worlds Promos",
    category: "Psyduck Cameo",
    phase: "Phase 7 - Optional Variants & Side Purchases",
    status: "Need to Buy",
    notes: "Optional advanced Psyduck cameo family. Track later.",
    tcgplayerSearchUrl: tcgSearch("Tropical Wind Psyduck Pokemon card"),
  },
];

export const psyduckCards: PsyduckCard[] = [
  ...ownedPsyduckCards,
  ...needToBuyCorePsyduckCards,
  ...needToBuyCameoCards,
];

export const nextRecommendedBuyIds = [
  "mistys-psyduck-gym-heroes-54",
  "mistys-psyduck-gym-challenge-90",
  "sabrinas-psyduck-gym-challenge-99",
  "psyduck-legendary-collection-88",
  "psyduck-boundaries-crossed-33",
  "psyduck-151-175",
] as const;

export const bulkHoardTargetIds = [
  "psyduck-151-054-reverse",
  "psyduck-151-054-regular",
] as const;

const cardById = new Map(psyduckCards.map((card) => [card.id, card]));

export function getCardsById(ids: readonly string[]) {
  return ids.flatMap((id) => {
    const card = cardById.get(id);
    return card ? [card] : [];
  });
}

export function isChaseCard(card: PsyduckCard) {
  const notes = card.notes?.toLowerCase() ?? "";
  return (card.marketPrice ?? 0) >= 75 || notes.includes("chase");
}

export function getPsyduckCollectionStats(cards: PsyduckCard[] = psyduckCards) {
  let totalOwnedCore = 0;
  let totalNeededCore = 0;
  let totalOwnedCameos = 0;
  let totalNeededCameos = 0;
  let estimatedOwnedMarketValue = 0;
  let estimatedNeededMarketValue = 0;
  let biggestOwnedCard: PsyduckCard | undefined;

  for (const card of cards) {
    const marketPrice = card.marketPrice ?? 0;

    if (card.category === "Core Psyduck" && card.status === "Owned") {
      totalOwnedCore += 1;
    }

    if (card.category === "Core Psyduck" && card.status === "Need to Buy") {
      totalNeededCore += 1;
    }

    if (card.category === "Psyduck Cameo" && card.status === "Owned") {
      totalOwnedCameos += 1;
    }

    if (card.category === "Psyduck Cameo" && card.status === "Need to Buy") {
      totalNeededCameos += 1;
    }

    if (card.status === "Owned") {
      estimatedOwnedMarketValue += marketPrice;

      if (!biggestOwnedCard || marketPrice > (biggestOwnedCard.marketPrice ?? 0)) {
        biggestOwnedCard = card;
      }
    } else {
      estimatedNeededMarketValue += marketPrice;
    }
  }

  return {
    totalOwnedCore,
    totalNeededCore,
    totalOwnedCameos,
    totalNeededCameos,
    estimatedOwnedMarketValue,
    estimatedNeededMarketValue,
    biggestOwnedCard,
  };
}
