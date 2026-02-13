import { Request, Response } from "express";
import { SpeciesService } from "../services/species.service";
import { SpeciesQuery, SpeciesParams } from "../types/species.types";

export class SpeciesController {
  private static speciesService = new SpeciesService();

  //Obtener todas (con filtros + paginación)
  static async getAll(req: Request<{}, {}, {}, SpeciesQuery>, res: Response) {
    try {
      const { region, category, page = "1", limit = "10" } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);

      if (
        Number.isNaN(pageNum) ||
        Number.isNaN(limitNum) ||
        pageNum < 1 ||
        limitNum < 1 ||
        limitNum > 100
      ) {
        return res.status(400).json({
          error: "Parámetros de paginación inválidos",
        });
      }

      const result = await this.speciesService.getAll(
        {
          region: region?.trim(),
          category: category?.trim(),
        },
        pageNum,
        limitNum,
      );

      return res.status(200).json({
        data: result.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      console.error("SpeciesController.getAll:", error);
      return res.status(500).json({
        error: "Error interno al obtener especies",
      });
    }
  }

  // Obtener una por ID
  static async getOne(req: Request<SpeciesParams>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "ID inválido",
        });
      }

      const species = await this.speciesService.getOne(id);

      if (!species) {
        return res.status(404).json({
          error: "Especie no encontrada",
        });
      }

      return res.status(200).json(species);
    } catch (error) {
      console.error("SpeciesController.getOne:", error);
      return res.status(500).json({
        error: "Error interno al obtener la especie",
      });
    }
  }
}
