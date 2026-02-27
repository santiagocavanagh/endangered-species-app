export interface CreateDTO {
  scientificName: string;
  commonName?: string;
  iucnStatus: "EX" | "EW" | "CR" | "EN" | "VU" | "NT" | "LC" | "DD" | "NE";
  taxonomyId: number;
  description?: string;
  habitat?: string;
  regionIds: number[];

  population?: number;
  censusDate?: Date;
  sourceId?: number;
  notes?: string;
}

export interface UpdateDTO {
  scientificName?: string;
  commonName?: string;
  iucnStatus?: "EX" | "EW" | "CR" | "EN" | "VU" | "NT" | "LC" | "DD" | "NE";
  taxonomyId?: number;
  description?: string;
  habitat?: string;
  regionIds?: number[];

  population?: number;
  censusDate?: Date;
  sourceId?: number;
  notes?: string;
}

export interface ResponseDTO {
  id: number;
  scientificName: string;
  name?: string | null;
  commonName?: string | null;
  iucnStatus: string;
  status?: string;
  taxonomyId: number;
  taxonomy?: {
    kingdom: string;
    phylum?: string | null;
    class_name?: string | null;
    order_name?: string | null;
    family?: string | null;
    genus?: string | null;
  };
  description?: string | null;
  habitat?: string | null;
  regions: string[];
  latestPopulation?: number;
  latestCensusDate?: string;
  media?: Array<{
    mediaUrl: string;
    mediaType: string;
    credit?: string | null;
    license?: string | null;
  }>;
}
