import { Request, Response, NextFunction } from "express";
import { SpeciesService } from "../services/species.service";
import { SpeciesMapper } from "../mappers/species.mapper";

const service = new SpeciesService();

export class SpeciesController {
  // Critical
  static async getCritical(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getCritical();
      return res.json(data.map(SpeciesMapper));
    } catch (error) {
      next(error);
    }
  }

  // List all (public)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getAll();
      return res.json(data.map(SpeciesMapper));
    } catch (error) {
      next(error);
    }
  }

  // Rescued
  static async getRescued(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getRescued();
      return res.json(data.map(SpeciesMapper));
    } catch (error) {
      next(error);
    }
  }

  // Get by id
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

      return res.json(SpeciesMapper(species));
    } catch (error) {
      next(error);
    }
  }

  // Create
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await service.create(req.body);
      return res.status(201).json(SpeciesMapper(created));
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

      return res.json(SpeciesMapper(updated));
    } catch (error) {
      next(error);
    }
  }

  // Delete
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      await service.delete(id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
