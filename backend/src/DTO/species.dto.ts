import { z } from "zod";
import {
  createSpeciesSchema,
  updateSpeciesSchema,
} from "../schemas/species.schema";

export type CreateSpeciesDTO = z.infer<typeof createSpeciesSchema>;

export type UpdateSpeciesDTO = z.infer<typeof updateSpeciesSchema>;

export interface ResponseDTO {
  id: number;
  scientificName: string;
  commonName?: string | null;
  iucnStatus: string;
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
  latestCensus?: {
    population: number;
    date: string;
    source?: {
      id: number;
      name: string;
    };
  };

  media?: Array<{
    mediaUrl: string;
    mediaType: string;
    credit?: string | null;
    license?: string | null;
  }>;
}
