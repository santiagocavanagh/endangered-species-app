import { z } from "zod";
import { CONSERVATION_STATUSES } from "../constants/species.constant";

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

    censusDate: z.coerce.date().optional(),

    sourceId: z.coerce.number().int().positive().optional(),

    notes: z.string().optional(),
  })
  .strict()
  .refine((data) => !(data.population !== undefined && !data.censusDate), {
    message: "Censo obligatorio si población está presente",
    path: ["censusDate"],
  });

export const updateSpeciesSchema = createSpeciesSchema
  .partial()
  .strict()
  .refine((data) => !(data.population !== undefined && !data.censusDate), {
    message: "Censo obligatorio si población está presente",
    path: ["censusDate"],
  });

export type SpeciesIdParams = z.infer<typeof speciesIdParamSchema>;
export type SpeciesQuery = z.infer<typeof speciesQuerySchema>;
export type CreateSpeciesBody = z.infer<typeof createSpeciesSchema>;
export type UpdateSpeciesBody = z.infer<typeof updateSpeciesSchema>;
