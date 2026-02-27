// GET /species
export interface SpeciesQuery {
  region?: string;
  taxonomy?: string;
  page?: string;
  limit?: string;
}

// GET /species/:id
export interface SpeciesParams {
  id: string;
}
