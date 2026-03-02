import { Request, Response, NextFunction } from "express";
import { SpeciesService } from "../services/species.service";
import { SpeciesMapper } from "../mappers/species.mapper";

const service = new SpeciesService();

export class SpeciesController {
  static async getCritical(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getCritical();
      return res.json(data.map(SpeciesMapper));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getAll();
      return res.json(data.map(SpeciesMapper));
    } catch (error) {
      next(error);
    }
  }

  static async getRescued(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getRescued();
      return res.json(data.map(SpeciesMapper));
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const species = await service.getOne(id);
      if (!species)
        return res.status(404).json({ message: "Species not found" });
      return res.json(SpeciesMapper(species));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await service.create(req.body);
      if (!created)
        return res.status(500).json({ message: "Failed to create species" });
      return res.status(201).json(SpeciesMapper(created));
    } catch (error: any) {
      try {
        const fs = require("fs");
        const path = require("path");
        const reportsDir = path.resolve(process.cwd(), "..", "REPORTES");
        fs.mkdirSync(reportsDir, { recursive: true });
        const out = path.join(reportsDir, "backend_error.log");
        const msg = `[${new Date().toISOString()}] CREATE ERROR: ${error && error.stack ? error.stack : JSON.stringify(error)}\n`;
        fs.appendFileSync(out, msg);
      } catch (w) {
        console.error("Failed to write create error log", w);
      }
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const updated = await service.update(id, req.body);
      if (!updated)
        return res.status(500).json({ message: "Failed to update species" });
      return res.json(SpeciesMapper(updated));
    } catch (error: any) {
      try {
        const fs = require("fs");
        const path = require("path");
        const reportsDir = path.resolve(process.cwd(), "..", "REPORTES");
        fs.mkdirSync(reportsDir, { recursive: true });
        const out = path.join(reportsDir, "backend_error.log");
        const msg = `[${new Date().toISOString()}] UPDATE ERROR: ${error && error.stack ? error.stack : JSON.stringify(error)}\n`;
        fs.appendFileSync(out, msg);
      } catch (w) {
        console.error("Failed to write update error log", w);
      }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await service.delete(id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
