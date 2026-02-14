import { Router } from "express";
import { SpeciesController } from "../controllers/species.controller";
import { authenticateToken, isAdmin } from "../middleware/auth.middleware";
import { limiter } from "../middleware/rate.limiter";
import {
  validateCreateSpecies,
  validateUpdateSpecies,
  handleValidationErrors,
} from "../middleware/species.validation";

const router = Router();

// Public
router.get("/critical", limiter, SpeciesController.getCritical);
router.get("/rescued", limiter, SpeciesController.getRescued);
router.get("/:id", limiter, SpeciesController.getOne);

// Admin
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
