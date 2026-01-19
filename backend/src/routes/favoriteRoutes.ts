import { Router } from "express";
import { favoriteController } from "../controllers/favoriteController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();
router.get("/", authenticateToken, favoriteController.getFavorites);
router.post("/:speciesId", authenticateToken, favoriteController.addFavorite);
router.delete("/:speciesId", authenticateToken, favoriteController.removeFavorite);

export default router;
