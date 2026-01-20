import { Router } from "express";
import { authenticateToken, isAdmin } from "../middleware/auth.middleware";
import { speciesController } from "../controllers/species.controller";

const router = Router();

router.get("/", speciesController.getAll);
router.get("/:id", speciesController.getOne);

router.post("/", authenticateToken, isAdmin, speciesController.create);

router.put("/:id", authenticateToken, isAdmin, speciesController.update);

router.delete("/:id", authenticateToken, isAdmin, speciesController.delete);

export default router;
