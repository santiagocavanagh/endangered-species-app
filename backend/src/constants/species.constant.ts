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

export type ConservationStatus = (typeof CONSERVATION_STATUSES)[number];
