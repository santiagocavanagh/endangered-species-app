import { Router } from "express";
import { authenticateToken, isAdmin } from "../middleware/auth.middleware";
import {
  validateCreateSpecies,
  validateUpdateSpecies,
  handleValidationErrors,
} from "../middleware/species.validation";
import { SpeciesController } from "../controllers/species.controller";

const router = Router();

router.get("/", SpeciesController.getAll);
router.get("/:id", SpeciesController.getOne);

router.post(
  "/",
  authenticateToken,
  isAdmin,
  validateCreateSpecies,
  handleValidationErrors,
  SpeciesController.create,
);

router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  validateUpdateSpecies,
  handleValidationErrors,
  SpeciesController.update,
);

router.delete("/:id", authenticateToken, isAdmin, SpeciesController.delete);

export default router;
