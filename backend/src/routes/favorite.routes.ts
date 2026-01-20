import { Router } from "express";
import { favoriteController } from "../controllers/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();
router.get("/", authenticateToken, favoriteController.getFavorites);
router.post("/:speciesId", authenticateToken, favoriteController.addFavorite);
router.delete(
  "/:speciesId",
  authenticateToken,
  favoriteController.removeFavorite,
);

export default router;
