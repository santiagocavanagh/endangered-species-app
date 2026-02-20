export const SPECIES_STATUS = ["CR", "EN", "VU", "NT", "LC", "EX"] as const;
export const SPECIES_CATEGORIES = ["animal", "planta", "hongo"] as const;
export const SPECIES_TREND = [
  "aumento",
  "descenso",
  "estable",
  "desconocido",
] as const;
export const POPULATION_OPERATORS = ["<", ">", "<=", ">=", "~"] as const;

export type SpeciesStatus = (typeof SPECIES_STATUS)[number];
export type SpeciesCategory = (typeof SPECIES_CATEGORIES)[number];
export type SpeciesTrend = (typeof SPECIES_TREND)[number];
export type PopulationOperator = "<" | ">" | "<=" | ">=" | "~";
