import { Request, Response } from "express";
import { AppDataSource } from "../config/data.source";
import { Taxonomy } from "../entities/taxonomy.entity";

const taxonomyRepo = AppDataSource.getRepository(Taxonomy);

export const TaxonomyController = {
  getAll: async (_req: Request, res: Response) => {
    try {
      const list = await taxonomyRepo.find();
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener taxonomías" });
    }
  },

  getOne: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const item = await taxonomyRepo.findOneBy({ id });
      if (!item) return res.status(404).json({ error: "No encontrado" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener taxonomía" });
    }
  },
};
