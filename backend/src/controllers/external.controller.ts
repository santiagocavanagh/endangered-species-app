import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.util";
import { ExternalService } from "../services/external.service";

const service = new ExternalService();

export class ExternalController {
  static syncSpeciesReferences = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
      const result = await service.syncSpeciesReferences(Number(req.params.id));
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
