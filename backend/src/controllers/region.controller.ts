import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.util";
import { RegionService } from "../services/region.service";

const service = new RegionService();

export const RegionController = {
  getAll: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await service.getAll());
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    res.json(await service.getOne(Number(req.params.id)));
  }),
};
