export const SPECIES_CATEGORIES = ["animal", "planta", "hongo"] as const;
export const POPULATION_OPERATORS = ["<", ">", "<=", ">=", "~"] as const;
export const CONSERVATION_STATUSES = [
  "EX",
  "EW",
  "CR",
  "EN",
  "VU",
  "NT",
  "LC",
  "DD",
  "NE",
] as const;

export type SpeciesCategory = (typeof SPECIES_CATEGORIES)[number];
export type PopulationOperator = "<" | ">" | "<=" | ">=" | "~";
export type ConservationStatus = "CR" | "EN" | "VU" | "NT" | "LC" | "EX" | "EW";
