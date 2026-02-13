import { Request, Response } from "express";
import { SpeciesService } from "../services/species.service";

interface SpeciesParams {
  id: string;
}

export class SpeciesController {
  private static speciesService = new SpeciesService();

  static async getAll(req: Request, res: Response) {
    try {
      const { region, category, page = "1", limit = "10" } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10) || 10),
      );

      const result = await this.speciesService.getAll(
        { region, category },
        pageNum,
        limitNum,
      );

      return res.json({
        data: result.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      return res.status(500).json({ error: "Error al obtener especies" });
    }
  }

  static async getOne(req: Request<SpeciesParams>, res: Response) {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const species = await this.speciesService.getOne(id);

    if (!species) {
      return res.status(404).json({ message: "Especie no encontrada" });
    }

    return res.json(species);
  }
}
