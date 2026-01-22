import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../config/data.source";
import { Species } from "../entities/species.entity";
import { AuthRequest } from "../types/auth.types";

export class SpeciesController {
  private static speciesRepo = AppDataSource.getRepository(Species);

  // 1. OBTENER TODAS CON FILTROS Y PAGINACIÓN (Público)
  static async getAll(req: Request, res: Response) {
    try {
      const { region, category, page = "1", limit = "10" } = req.query;

      // Validar paginación
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10) || 10),
      );
      const skip = (pageNum - 1) * limitNum;

      const queryOptions: any = { where: {}, skip, take: limitNum };

      // Filtro por región (Validación: solo valores permitidos)
      if (region) {
        const validRegions = [
          "America",
          "Europa",
          "Africa",
          "Asia",
          "Oceania",
          "Global",
        ];
        if (validRegions.includes(region as string)) {
          queryOptions.where.region = region;
        }
      }

      // Filtro por categoría (Validación: solo valores permitidos)
      if (category) {
        const validCategories = ["animal", "planta", "hongo"];
        if (validCategories.includes(category as string)) {
          queryOptions.where.category = category;
        }
      }

      const [species, total] =
        await SpeciesController.speciesRepo.findAndCount(queryOptions);

      return res.json({
        data: species,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error en getAll:", error);
      return res.status(500).json({ error: "Error al obtener especies" });
    }
  }

  // 2. LÓGICA DE HISTORIAS DE ÉXITO (Público)
  static async getSuccessStories(req: Request, res: Response) {
    try {
      const stories = await SpeciesController.speciesRepo.find({
        where: {
          isVisible: true,
          status: In(["LC", "NT"]),
          currentTrend: In(["Aumento", "Estable"]),
        },
        order: { name: "ASC" },
        take: 20, // Límite para no sobrecargar
      });

      return res.json(stories);
    } catch (error) {
      console.error("Error en getSuccessStories:", error);
      return res
        .status(500)
        .json({ error: "Error al obtener historias de éxito" });
    }
  }

  // 3. ESPECIES EN PELIGRO CRÍTICO (Para la Home)
  static async getEndangered(req: Request, res: Response) {
    try {
      const endangered = await SpeciesController.speciesRepo.find({
        where: {
          isVisible: true,
          status: In(["CR", "EN", "VU"]),
        },
        order: { status: "ASC" },
        take: 50,
      });

      return res.json(endangered);
    } catch (error) {
      console.error("Error en getEndangered:", error);
      return res
        .status(500)
        .json({ error: "Error al obtener especies en peligro" });
    }
  }

  // 4. DETALLE DE UNA ESPECIE
  static async getOne(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const numericId = parseInt(id as string, 10);

      if (isNaN(numericId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const animal = await SpeciesController.speciesRepo.findOne({
        where: { id: numericId },
        relations: ["tendencyHistory"], // Traemos los datos del gráfico
      });

      if (!animal) {
        return res.status(404).json({ message: "Especie no encontrada" });
      }

      return res.json(animal);
    } catch (error) {
      console.error("Error en getOne:", error);
      return res.status(500).json({ error: "Error al obtener detalle" });
    }
  }

  // 5. CREAR (Protegido - Requiere Admin)
  static create = async (req: AuthRequest, res: Response) => {
    try {
      // TODO: Implementar validación con DTO (Joi, zod, class-validator, etc.)
      const newSpecies = SpeciesController.speciesRepo.create(req.body);
      const result = await SpeciesController.speciesRepo.save(newSpecies);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error al crear:", error);
      return res.status(500).json({ message: "Error al crear especie" });
    }
  };

  // 6. ACTUALIZAR (Protegido - Requiere Admin)
  static update = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
      const numericId = parseInt(id as string, 10);

      if (isNaN(numericId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const species = await SpeciesController.speciesRepo.findOneBy({
        id: numericId,
      });

      if (!species) {
        return res.status(404).json({ message: "Especie no encontrada" });
      }

      SpeciesController.speciesRepo.merge(species, req.body);
      const result = await SpeciesController.speciesRepo.save(species);

      return res.json(result);
    } catch (error) {
      console.error("Error al actualizar:", error);
      return res.status(500).json({ message: "Error al actualizar especie" });
    }
  };

  // 7. BORRAR (Protegido - Requiere Admin)
  static delete = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
      const numericId = parseInt(id as string, 10);

      if (isNaN(numericId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const result = await SpeciesController.speciesRepo.delete(numericId);

      if (result.affected === 0) {
        return res.status(404).json({ message: "Especie no encontrada" });
      }

      return res.json({ message: "Especie eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar:", error);
      return res.status(500).json({ message: "Error al eliminar especie" });
    }
  };
}
