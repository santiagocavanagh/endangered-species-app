import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Species } from "../entities/species";

export class speciesController {
  static async getAll(req: Request, res: Response) {
    const speciesRepository = AppDataSource.getRepository(Species);
    const species = await speciesRepository.find();
    return res.json(species);
  }

  static create = async (req: Request, res: Response) => {
    try {
      const speciesRepo = AppDataSource.getRepository(Species);
      const newSpecies = speciesRepo.create(req.body);
      const result = await speciesRepo.save(newSpecies);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: "Error al crear especie" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const speciesRepo = AppDataSource.getRepository(Species);

    try {
      const numericId = parseInt(id as string, 10);
      if (isNaN(numericId)) {
        return res
          .status(400)
          .json({ message: "El ID proporcionado no es un número válido" });
      }

      let species = await speciesRepo.findOneBy({ id: numericId });

      if (!species) {
        return res.status(404).json({ message: "La especie no existe" });
      }

      speciesRepo.merge(species, req.body);
      const result = await speciesRepo.save(species);

      return res.json(result);
    } catch (error) {
      console.error("Error al actualizar:", error);
      return res.status(500).json({ message: "Error al actualizar" });
    }
  };

  static delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const speciesRepo = AppDataSource.getRepository(Species);

    try {
      const numericId = parseInt(id as string, 10);
      const result = await speciesRepo.delete(numericId);

      if (result.affected === 0) {
        return res
          .status(404)
          .json({ message: "No se encontró la especie para borrar" });
      }

      return res.json({ message: "Especie eliminada correctamente" });
    } catch (error) {
      return res.status(500).json({ message: "Error al eliminar" });
    }
  };
}
