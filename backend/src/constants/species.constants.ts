export const SPECIES_STATUS = ["CR", "EN", "VU", "NT", "LC", "EX"] as const;
export const SPECIES_CATEGORIES = ["animal", "planta", "hongo"] as const;
export const SPECIES_REGIONS = [
  "America",
  "Europa",
  "Asia",
  "Africa",
  "Oceania",
  "Global",
] as const;

export type SpeciesStatus = (typeof SPECIES_STATUS)[number];
export type SpeciesCategory = (typeof SPECIES_CATEGORIES)[number];
export type SpeciesRegion = (typeof SPECIES_REGIONS)[number];
