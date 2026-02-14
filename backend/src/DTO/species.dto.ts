export interface CreateDTO {
  scientificName: string;
  name: string;
  category: "animal" | "planta" | "hongo";
  habitat: string;
  status: "CR" | "EN" | "VU" | "NT" | "LC" | "EX";
  populationValue: number;
  populationOperator?: string;
  imageUrl: string;
  regionIds: number[];
  censusDate: Date;
}

export interface UpdateDTO {
  scientificName?: string;
  name?: string;
  category?: "animal" | "planta" | "hongo";
  habitat?: string;
  status?: "CR" | "EN" | "VU" | "NT" | "LC" | "EX";
  populationValue?: number;
  populationOperator?: string;
  imageUrl?: string;
  regionIds?: number[];
  censusDate?: Date;
}

export interface ResponseDTO {
  id: number;
  scientificName: string;
  name: string;
  category: "animal" | "planta" | "hongo";
  habitat: string;
  status: "CR" | "EN" | "VU" | "NT" | "LC" | "EX";

  imageUrl: string;

  region: string[];

  populationDisplay: string;
  riskLevel: number;
  isCritical: boolean;

  trendDirection: "up" | "down" | "stable" | "unknown";
}
