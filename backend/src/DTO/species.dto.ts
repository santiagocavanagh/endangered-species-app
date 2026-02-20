import {
  SpeciesCategory,
  SpeciesStatus,
  SpeciesTrend,
  PopulationOperator,
} from "../constants/species.constants";

export interface CreateDTO {
  scientificName: string;
  name: string;
  category: SpeciesCategory;
  habitat: string;
  status: SpeciesStatus;
  populationValue: number;
  populationOperator?: PopulationOperator;
  imageUrl: string;
  regionIds: number[];
  censusDate: Date;
}

export interface UpdateDTO {
  scientificName?: string;
  name?: string;
  category?: SpeciesCategory;
  habitat?: string;
  status?: SpeciesStatus;
  populationValue?: number;
  populationOperator?: PopulationOperator;
  imageUrl?: string;
  regionIds?: number[];
  censusDate?: Date;
}

export interface ResponseDTO {
  id: number;
  scientificName: string;
  name: string;
  category: SpeciesCategory;
  habitat: string;
  status: SpeciesStatus;

  imageUrl: string;

  region: string[];

  populationDisplay: string;
  riskLevel: number;
  isCritical: boolean;

  trendDirection: SpeciesTrend;
}
