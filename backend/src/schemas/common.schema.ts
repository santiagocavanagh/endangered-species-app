import { z } from "zod";

// Validación genérica de ":id" numérico en params, reutilizada por species/region/taxonomy/favorites.
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type IdParams = z.infer<typeof idParamSchema>;
