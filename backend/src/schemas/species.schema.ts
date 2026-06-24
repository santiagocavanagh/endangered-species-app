import { z } from "zod";
import { CONSERVATION_STATUSES } from "../constants/species.constant";

export const speciesIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const speciesQuerySchema = z.object({
  taxonomy: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  region: z.string().optional(),
  habitat: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const createSpeciesSchema = z
  .object({
    scientificName: z.string().min(3).max(75),
    commonName: z.string().min(3).max(75).optional(),
    iucnStatus: z.enum(CONSERVATION_STATUSES),
    taxonomyId: z.coerce.number().int().positive(),
    description: z.string().optional(),
    habitat: z.string().optional(),
    regionIds: z.array(z.coerce.number().int().positive()).min(1),
    population: z.coerce
      .number()
      .int()
      .positive()
      .max(1_000_000_000_000)
      .optional(),
    censusDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    sourceId: z.coerce.number().int().positive().optional(),
    notes: z.string().optional(),
    imageUrl: z.string().url().optional(),
  })
  .strict();

export const updateSpeciesSchema = createSpeciesSchema.partial();

export type SpeciesIdParams = z.infer<typeof speciesIdParamSchema>;
export type SpeciesQuery = z.infer<typeof speciesQuerySchema>;
export type CreateSpeciesBody = z.infer<typeof createSpeciesSchema>;
export type UpdateSpeciesBody = z.infer<typeof updateSpeciesSchema>;
