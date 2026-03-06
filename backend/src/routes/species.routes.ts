import { Router } from "express";
import { authenticateToken, isAdmin } from "../middleware/auth.middleware";
import { limiter } from "../middleware/rate.limiter";
import {
  createSpeciesSchema,
  speciesIdParamSchema,
  speciesQuerySchema,
  updateSpeciesSchema,
} from "../schemas/species.schema";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware";
import { SpeciesController } from "../controllers/species.controller";

const router = Router();

// User
router.get(
  "/species",
  limiter,
  validateQuery(speciesQuerySchema),
  SpeciesController.getAll,
);

router.get("/species/critical", limiter, SpeciesController.getCritical);
router.get("/species/rescued", limiter, SpeciesController.getRescued);

router.get(
  "/species/:id",
  limiter,
  validateParams(speciesIdParamSchema),
  SpeciesController.getOne,
);
// Admin
router.post(
  "/species",
  limiter,
  authenticateToken,
  isAdmin,
  validateBody(createSpeciesSchema),
  SpeciesController.create,
);

router.patch(
  "/species/:id",
  limiter,
  authenticateToken,
  isAdmin,
  validateParams(speciesIdParamSchema),
  validateBody(updateSpeciesSchema),
  SpeciesController.update,
);

router.delete(
  "/species/:id",
  limiter,
  authenticateToken,
  isAdmin,
  validateParams(speciesIdParamSchema),
  SpeciesController.delete,
);

export default router;
