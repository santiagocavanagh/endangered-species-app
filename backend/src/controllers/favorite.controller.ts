import { Response } from "express";
import { asyncHandler } from "../utils/async-handler.util";
import { FavoriteService } from "../services/favorite.service";
import { requireUser } from "../utils/require-user.util";
import { AuthRequest } from "../types/auth.types";

const service = new FavoriteService();

type ReqWithParams = AuthRequest & {
  params: { id: string };
};

export const FavoriteController = {
  getFavorites: asyncHandler(async (req: AuthRequest, res: Response) => {
    requireUser(req);
    const data = await service.getFavorites(req.user.id);
    res.json(data);
  }),

  addFavorite: asyncHandler(async (req: ReqWithParams, res: Response) => {
    requireUser(req);
    const result = await service.addFavorite(
      req.user.id,
      Number(req.params.id),
    );
    res.status(201).json(result);
  }),

  removeFavorite: asyncHandler(async (req: ReqWithParams, res: Response) => {
    requireUser(req);
    const result = await service.removeFavorite(
      req.user.id,
      Number(req.params.id),
    );
    res.json(result);
  }),
};
