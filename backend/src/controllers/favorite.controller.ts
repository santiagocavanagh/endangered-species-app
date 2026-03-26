import { Response, NextFunction } from "express";
import { FavoriteService } from "../services/favorite.service";
import { FavoriteParams } from "../schemas/favorite.schema";
import { AuthRequest } from "../types/auth.types";

const service = new FavoriteService();

type ReqWithParams = AuthRequest & {
  params: FavoriteParams;
};

export const FavoriteController = {
  getFavorites: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await service.getFavorites(req.user.id);
      return res.json(data);
    } catch (error) {
      next(error);
    }
  },

  addFavorite: async (
    req: ReqWithParams,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await service.addFavorite(req.user.id, req.params.id);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  removeFavorite: async (
    req: ReqWithParams,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await service.removeFavorite(req.user.id, req.params.id);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
