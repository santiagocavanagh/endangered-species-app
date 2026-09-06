import { Request, Response, NextFunction } from "express";
import { TaxonomyService } from "../services/taxonomy.service";

const service = new TaxonomyService();

export const TaxonomyController = {
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.getAll();
      return res.json(data);
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const data = await service.getOne(id);
      return res.json(data);
    } catch (error) {
      next(error);
    }
  },
};
