import { Router } from "express";
import { authenticateToken, isAdmin } from "../middleware/auth.middleware";
import { SpeciesController } from "../controllers/species.controller";

const router = Router();

router.get("/", SpeciesController.getAll);
router.get("/:id", SpeciesController.getOne);

router.post("/", authenticateToken, isAdmin, SpeciesController.create);

router.put("/:id", authenticateToken, isAdmin, SpeciesController.update);

router.delete("/:id", authenticateToken, isAdmin, SpeciesController.delete);

export default router;
