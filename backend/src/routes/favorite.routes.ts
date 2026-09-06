import { Router } from "express";
import { FavoriteController } from "../controllers/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { limiter } from "../middleware/rate.limiter";
import { validateParams } from "../middleware/validate.middleware";
import { favoriteParamsSchema } from "../schemas/favorite.schema";

const router = Router();

router.get("/", limiter, authenticateToken, FavoriteController.getFavorites);

router.post(
  "/:id",
  limiter,
  authenticateToken,
  validateParams(favoriteParamsSchema),
  FavoriteController.addFavorite,
);

router.delete(
  "/:id",
  limiter,
  authenticateToken,
  validateParams(favoriteParamsSchema),
  FavoriteController.removeFavorite,
);

export default router;
