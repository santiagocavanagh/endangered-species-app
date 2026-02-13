import { Request, Response, NextFunction } from "express";
import { SpeciesService } from "../services/species.service";

const service = new SpeciesService();

export class SpeciesController {
  // Get All
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const filters = {
        category: req.query.category as any,
        region: req.query.region as string | undefined,
      };

      const result = await service.getAll(filters, page, limit);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get One
  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const species = await service.getOne(id);

      if (!species) {
        return res.status(404).json({ message: "Species not found" });
      }

      return res.json(species);
    } catch (error) {
      next(error);
    }
  }

  // Create
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await service.create(req.body);

      return res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  // Update
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const updated = await service.update(id, req.body);

      if (!updated) {
        return res.status(404).json({ message: "Species not found" });
      }

      return res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // Soft Delete
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const deleted = await service.delete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Species not found" });
      }

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
