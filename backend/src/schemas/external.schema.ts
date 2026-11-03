import { z } from "zod";

// Límite acotado: sincronizar contra GBIF/IUCN es costoso (requests externos por especie).
export const externalBatchSyncQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  delayMs: z.coerce.number().int().nonnegative().max(5000).optional(),
});

export type ExternalBatchSyncQuery = z.infer<
  typeof externalBatchSyncQuerySchema
>;
