import { Router } from "express";
import { ExternalController } from "../controllers/external.controller";
import { limiter } from "../middleware/rate.limiter";
import { authenticateToken, isAdmin } from "../middleware/auth.middleware";
import { validateParams } from "../middleware/validate.middleware";
import { speciesIdParamSchema } from "../schemas/species.schema";

const router = Router();

router.post(
  "/species/:id/sync",
  limiter,
  authenticateToken,
  isAdmin,
  validateParams(speciesIdParamSchema),
  ExternalController.syncSpeciesReferences,
);

router.get(
  "/species/:id/distribution",
  limiter,
  validateParams(speciesIdParamSchema),
  ExternalController.getSpeciesDistribution,
);

export default router;
