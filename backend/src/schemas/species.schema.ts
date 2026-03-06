import { z } from "zod";
import { CONSERVATION_STATUSES } from "../constants/species.constants";

export const speciesIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const speciesQuerySchema = z.object({
  region: z.string().optional(),
  taxonomy: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const createSpeciesSchema = z
  .object({
    scientificName: z.string().min(3).max(75),
    commonName: z.string().min(3).max(75).optional(),

    iucnStatus: z.enum(CONSERVATION_STATUSES),

    taxonomyId: z.number().int().positive(),

    description: z.string().optional(),
    habitat: z.string().optional(),

    regionIds: z.array(z.number().int().positive()).min(1),

    population: z.number().int().positive().max(1_000_000_000_000).optional(),

    censusDate: z.coerce.date().optional(),

    sourceId: z.number().int().positive().optional(),

    notes: z.string().optional(),
  })
  .refine((data) => !(data.population !== undefined && !data.censusDate), {
    message: "Al enviar numero de poblacion, fecha de censo es obligatorio",
  });

export const updateSpeciesSchema = createSpeciesSchema
  .partial()
  .refine((data) => !(data.population !== undefined && !data.censusDate), {
    message: "Al enviar numero de poblacion, fecha de censo es obligatorio",
  });
