import { Router } from "express";
import { limiter } from "../middleware/rate.limiter";
import { validateParams } from "../middleware/validate.middleware";
import { speciesIdParamSchema } from "../schemas/species.schema";
import { TaxonomyController } from "../controllers/taxonomy.controller";

const router = Router();

router.get("/", limiter, TaxonomyController.getAll);
router.get(
  "/:id",
  limiter,
  validateParams(speciesIdParamSchema),
  TaxonomyController.getOne,
);

export default router;
