// GET /species
export interface SpeciesQuery {
  region?: string;
  category?: string;
  page?: string;
  limit?: string;
}

// GET /species/:id
export interface SpeciesParams {
  id: string;
}
