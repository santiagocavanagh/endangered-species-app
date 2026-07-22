import { Request, Response, NextFunction } from "express";
import { ExternalService } from "../services/external.service";

const service = new ExternalService();

export class ExternalController {
  static async syncSpeciesReferences(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const speciesId = Number(req.params.id);
      const result = await service.syncSpeciesReferences(speciesId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSpeciesDistribution(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const speciesId = Number(req.params.id);
      const result = await service.getSpeciesDistribution(speciesId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
