import { Router } from "express";
import { SpeciesController } from "../controllers/species.controller";
import { authenticateToken, isAdmin } from "../middleware/auth.middleware";
import { limiter } from "../middleware/rate.limiter";
import {
  validateSpeciesId,
  validateCreateSpecies,
  validateUpdateSpecies,
  handleValidationErrors,
} from "../middleware/species.validation";

const router = Router();

// Public
router.get("/critical", limiter, SpeciesController.getCritical);
router.get("/rescued", limiter, SpeciesController.getRescued);
router.get(
  "/:id",
  limiter,
  validateSpeciesId,
  handleValidationErrors,
  SpeciesController.getOne,
);

// Admin
router.post(
  "/",
  authenticateToken,
  isAdmin,
  limiter,
  validateCreateSpecies,
  handleValidationErrors,
  SpeciesController.create,
);

router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  limiter,
  validateSpeciesId,
  validateUpdateSpecies,
  handleValidationErrors,
  SpeciesController.update,
);

router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  limiter,
  validateSpeciesId,
  handleValidationErrors,
  SpeciesController.delete,
);
export default router;
