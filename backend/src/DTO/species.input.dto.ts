import { z } from "zod";
import {
  createSpeciesSchema,
  updateSpeciesSchema,
} from "../schemas/species.schema";

export type CreateSpeciesDTO = z.infer<typeof createSpeciesSchema>;

export type UpdateSpeciesDTO = z.infer<typeof updateSpeciesSchema>;
