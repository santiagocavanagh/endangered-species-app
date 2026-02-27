import { Request, Response } from "express";
import { AppDataSource } from "../config/data.source";
import { Favorite } from "../entities/favorites.entity";
import { Species } from "../entities/species.entity";
import { User } from "../entities/user.entity";

export const favoriteController = {
  // Obtener favoritos del usuario
  getFavorites: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const favoriteRepo = AppDataSource.getRepository(Favorite);
      const favorites = await favoriteRepo.find({
        where: { user: { id: userId } },
        relations: ["species"],
      });

      const speciesList = favorites.map((fav) => fav.species);
      res.json(speciesList);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener favoritos" });
    }
  },

  // Agregar especie a favoritos
  addFavorite: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { speciesId } = req.params;
      const id = Number(speciesId);

      const favoriteRepo = AppDataSource.getRepository(Favorite);
      const speciesRepo = AppDataSource.getRepository(Species);

      const species = await speciesRepo.findOneBy({ id });
      if (!species)
        return res.status(404).json({ error: "Especie no encontrada" });

      const existing = await favoriteRepo.findOne({
        where: { user: { id: userId }, species: { id } },
      });

      if (existing) return res.status(400).json({ error: "Ya es favorito" });

      const newFavorite = favoriteRepo.create({
        user: { id: userId } as User,
        species: { id } as Species,
      });

      await favoriteRepo.save(newFavorite);
      res.status(201).json({ message: "Agregado a favoritos" });
    } catch (error) {
      res.status(500).json({ error: "Error al agregar favorito" });
    }
  },

  // Eliminar especie de favoritos
  removeFavorite: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { speciesId } = req.params;
      const id = Number(speciesId);

      const favoriteRepo = AppDataSource.getRepository(Favorite);
      const favorite = await favoriteRepo.findOne({
        where: { user: { id: userId }, species: { id } },
      });

      if (!favorite) return res.status(404).json({ error: "No encontrado" });

      await favoriteRepo.remove(favorite);
      res.json({ message: "Eliminado de favoritos" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar favorito" });
    }
  },
};
