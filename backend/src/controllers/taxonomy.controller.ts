import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.util";
import { TaxonomyService } from "../services/taxonomy.service";

const service = new TaxonomyService();

export const TaxonomyController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const kingdom =
      typeof req.query.kingdom === "string" ? req.query.kingdom : undefined;
    res.json(await service.getAll(kingdom));
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    res.json(await service.getOne(Number(req.params.id)));
  }),
};
