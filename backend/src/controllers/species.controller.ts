import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.util";
import { SpeciesService } from "../services/species.service";
import { SpeciesMapper } from "../mappers/species.mapper";
import {
  SpeciesQuery,
  CreateSpeciesBody,
  UpdateSpeciesBody,
} from "../schemas/species.schema";

const service = new SpeciesService();

export class SpeciesController {
  static getAll = asyncHandler(
    async (req: Request<{}, {}, {}, SpeciesQuery>, res: Response) => {
      const result = await service.getAll(req.query);
      res.json({ data: result.data.map(SpeciesMapper), meta: result.meta });
    },
  );

  static getCritical = asyncHandler(async (_req: Request, res: Response) => {
    res.json((await service.getCritical()).map(SpeciesMapper));
  });

  static getRescued = asyncHandler(async (_req: Request, res: Response) => {
    res.json((await service.getRescued()).map(SpeciesMapper));
  });

  static getOne = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
      const species = await service.getOne(Number(req.params.id));
      res.json(SpeciesMapper(species));
    },
  );

  static create = asyncHandler(
    async (req: Request<{}, {}, CreateSpeciesBody>, res: Response) => {
      const created = await service.create(req.body);
      res.status(201).json(SpeciesMapper(created));
    },
  );

  static update = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
      const updated = await service.update(
        Number(req.params.id),
        req.body as UpdateSpeciesBody,
      );
      res.json(SpeciesMapper(updated));
    },
  );

  static delete = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
      await service.delete(Number(req.params.id));
      res.status(204).send();
    },
  );
}
