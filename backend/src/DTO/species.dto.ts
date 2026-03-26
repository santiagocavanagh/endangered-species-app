export interface TaxonomyDTO {
  kingdom: string;
  phylum?: string | null;
  className?: string | null;
  orderName?: string | null;
  family?: string | null;
  genus?: string | null;
}

export interface CensusDTO {
  population: number;
  date: string;
  source?: {
    id: number;
    name: string;
  };
}

export interface MediaDTO {
  mediaUrl: string;
  mediaType: string;
  credit?: string | null;
  license?: string | null;
}

export interface SpeciesDTO {
  id: number;
  scientificName: string;
  commonName: string | null;
  iucnStatus: string;
  taxonomyId: number;

  taxonomy?: TaxonomyDTO;

  description: string | null;
  habitat: string | null;

  regions: string[];

  latestCensus?: CensusDTO;

  media: MediaDTO[];
}
