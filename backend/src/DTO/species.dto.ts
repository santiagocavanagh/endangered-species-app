export interface SpeciesDTO {
  id: number;
  scientificName: string;
  name: string;
  category: string;
  habitat: string;
  status: string;
  imageUrl: string;

  region: string[];

  scope: "global" | "regional" | "unknown";
  populationDisplay: string;
  riskLevel: number;
  isCritical: boolean;
  trendDirection: "up" | "down" | "stable" | "unknown";
}
