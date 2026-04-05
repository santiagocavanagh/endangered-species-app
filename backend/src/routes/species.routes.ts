import { Router } from "express";
import { limiter } from "../middleware/rate.limiter";
import { authenticateToken, isAdmin } from "../middleware/auth.middleware";
import { SpeciesController } from "../controllers/species.controller";
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

const router = Router();

// User
router.get("/critical", limiter, SpeciesController.getCritical);
router.get("/rescued", limiter, SpeciesController.getRescued);

router.get(
  "/",
  limiter,
  validateQuery(speciesQuerySchema),
  SpeciesController.getAll,
);

router.get(
  "/:id",
  limiter,
  validateParams(speciesIdParamSchema),
  SpeciesController.getOne,
);
// Admin
router.post(
  "/",
  limiter,
  authenticateToken,
  isAdmin,
  validateBody(createSpeciesSchema),
  SpeciesController.create,
);

router.patch(
  "/:id",
  limiter,
  authenticateToken,
  isAdmin,
  validateParams(speciesIdParamSchema),
  validateBody(updateSpeciesSchema),
  SpeciesController.update,
);

router.delete(
  "/:id",
  limiter,
  authenticateToken,
  isAdmin,
  validateParams(speciesIdParamSchema),
  SpeciesController.delete,
);

export default router;
