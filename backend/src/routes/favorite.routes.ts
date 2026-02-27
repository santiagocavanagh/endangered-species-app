import { Router } from "express";
import { favoriteController } from "../controllers/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  validateSpeciesId,
  handleValidationErrors,
} from "../middleware/species.validation";

const router = Router();
router.get("/", authenticateToken, favoriteController.getFavorites);
router.post(
  "/:id",
  authenticateToken,
  validateSpeciesId,
  handleValidationErrors,
  favoriteController.addFavorite,
);
router.delete(
  "/:id",
  authenticateToken,
  validateSpeciesId,
  handleValidationErrors,
  favoriteController.removeFavorite,
);

export default router;
