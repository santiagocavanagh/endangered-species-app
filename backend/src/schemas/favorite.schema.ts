import { z } from "zod";

export const favoriteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
