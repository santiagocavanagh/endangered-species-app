import { Request, Response } from "express";
import { AppDataSource } from "../config/data.source";
import { Region } from "../entities/region.entity";

const regionRepo = AppDataSource.getRepository(Region);

export const RegionController = {
  getAll: async (_req: Request, res: Response) => {
    try {
      const list = await regionRepo.find({ order: { name: "ASC" } });
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener regiones" });
    }
  },

  getOne: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const item = await regionRepo.findOneBy({ id });
      if (!item) return res.status(404).json({ error: "No encontrado" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener región" });
    }
  },
};
