import { Router } from "express";
import { FavoriteController } from "../controllers/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateParams } from "../middleware/validate.middleware";

const router = Router();
router.get("/", authenticateToken, FavoriteController.getFavorites);
router.post(
  "/:id",
  authenticateToken,
  validateParams,
  FavoriteController.addFavorite,
);
router.delete(
  "/:id",
  authenticateToken,
  validateParams,
  FavoriteController.removeFavorite,
);

export default router;
