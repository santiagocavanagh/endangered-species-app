import { z } from "zod";

export const favoriteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

//export type FavoriteParams = z.infer<typeof favoriteParamsSchema>;
