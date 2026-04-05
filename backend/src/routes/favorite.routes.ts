import { Router } from "express";
import { FavoriteController } from "../controllers/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateParams } from "../middleware/validate.middleware";
import { favoriteParamsSchema } from "../schemas/favorite.schema";

const router = Router();

router.get("/", authenticateToken, FavoriteController.getFavorites);

router.post(
  "/:id",
  authenticateToken,
  validateParams(favoriteParamsSchema),
  FavoriteController.addFavorite,
);

router.delete(
  "/:id",
  authenticateToken,
  validateParams(favoriteParamsSchema),
  FavoriteController.removeFavorite,
);

export default router;
