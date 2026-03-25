import { Response, NextFunction } from "express";
import { FavoriteService } from "../services/favorite.service";
import { AuthRequest } from "../types/auth.types";
import { FavoriteParams } from "../schemas/favorite.schema";

const service = new FavoriteService();

export const FavoriteController = {
  getFavorites: async (
    req: AuthRequest & { params: FavoriteParams },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await service.getFavorites(req.user!.id);
      return res.json(data);
    } catch (error) {
      next(error);
    }
  },

  addFavorite: async (
    req: AuthRequest & { params: FavoriteParams },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const speciesId = Number(req.params.id);
      const result = await service.addFavorite(req.user!.id, speciesId);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  removeFavorite: async (
    req: AuthRequest & { params: FavoriteParams },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const speciesId = Number(req.params.id);
      const result = await service.removeFavorite(req.user!.id, speciesId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
