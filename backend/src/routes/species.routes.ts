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

router.get("/", limiter, SpeciesController.getAll);
router.get("/:id", limiter, SpeciesController.getOne);

router.post(
  "/",
  limiter,
  authenticateToken,
  isAdmin,
  validateCreateSpecies,
  handleValidationErrors,
  SpeciesController.create,
);

router.put(
  "/:id",
  limiter,
  authenticateToken,
  isAdmin,
  validateUpdateSpecies,
  handleValidationErrors,
  SpeciesController.update,
);

router.delete(
  "/:id",
  limiter,
  authenticateToken,
  isAdmin,
  SpeciesController.delete,
);

export default router;
