import { Request, Response, NextFunction } from "express";
import { SpeciesService } from "../services/species.service";
import { SpeciesMapper } from "../mappers/species.mapper";
import {
  SpeciesIdParams,
  SpeciesQuery,
  CreateSpeciesBody,
  UpdateSpeciesBody,
} from "../schemas/species.schema";

const service = new SpeciesService();

export class SpeciesController {
  static async getAll(
    req: Request<{}, {}, {}, SpeciesQuery>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await service.getAll(req.query);

      return res.json({
        data: result.data.map(SpeciesMapper),
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCritical(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getCritical();
      return res.json(data.map(SpeciesMapper));
    } catch (error) {
      next(error);
    }
  }

  static async getRescued(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getRescued();
      return res.json(data.map(SpeciesMapper));
    } catch (error) {
      next(error);
    }
  }

  static async getOne(
    req: Request<SpeciesIdParams>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const species = await service.getOne(Number(req.params.id));
      return res.json(SpeciesMapper(species));
    } catch (error) {
      next(error);
    }
  }

  static async create(
    req: Request<{}, {}, CreateSpeciesBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const created = await service.create(req.body);
      return res.status(201).json(SpeciesMapper(created));
    } catch (error) {
      next(error);
    }
  }

  static async update(
    req: Request<SpeciesIdParams, {}, UpdateSpeciesBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const updated = await service.update(Number(req.params.id), req.body);
      return res.json(SpeciesMapper(updated));
    } catch (error) {
      next(error);
    }
  }

  static async delete(
    req: Request<SpeciesIdParams>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await service.delete(Number(req.params.id));
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
