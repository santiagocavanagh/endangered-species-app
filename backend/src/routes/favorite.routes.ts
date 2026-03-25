import { Router } from "express";
import { FavoriteController } from "../controllers/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  validateSpeciesId,
  handleValidationErrors,
} from "../middleware/species.validation";

const router = Router();
router.get("/", authenticateToken, FavoriteController.getFavorites);
router.post(
  "/:id",
  authenticateToken,
  validateSpeciesId,
  handleValidationErrors,
  FavoriteController.addFavorite,
);
router.delete(
  "/:id",
  authenticateToken,
  validateSpeciesId,
  handleValidationErrors,
  FavoriteController.removeFavorite,
);

export default router;
