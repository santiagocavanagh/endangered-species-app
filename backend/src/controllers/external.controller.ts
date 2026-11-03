import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.util";
import { ExternalService } from "../services/external.service";
import { ExternalBatchSyncQuery } from "../schemas/external.schema";

const service = new ExternalService();

export class ExternalController {
  static syncSpeciesReferences = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
      const result = await service.syncSpeciesReferences(Number(req.params.id));
      res.json(result);
    },
  );

  // Sincronización masiva (GBIF/IUCN) para administración; reemplaza al script de CLI
  // inexistente "external-sync-batch" referenciado anteriormente en package.json.
  static syncBatch = asyncHandler(
    async (req: Request<{}, {}, {}, ExternalBatchSyncQuery>, res: Response) => {
      const result = await service.syncBatchSpeciesReferences(req.query);
      res.json(result);
    },
  );

  static getSpeciesDistribution = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
      const result = await service.getSpeciesDistribution(
        Number(req.params.id),
      );
      res.json(result);
    },
  );

  static getSpeciesRange = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
      const result = await service.getSpeciesRange(Number(req.params.id));
      res.json(result);
    },
  );

  static getSpeciesOccurrencePoints = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
      const result = await service.getSpeciesOccurrencePoints(
        Number(req.params.id),
      );
      res.json(result);
    },
  );
}
