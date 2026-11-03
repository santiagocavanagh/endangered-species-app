import { Router } from "express";
import { limiter } from "../middleware/rate.limiter";
import { validateParams } from "../middleware/validate.middleware";
import { idParamSchema } from "../schemas/common.schema";
import { TaxonomyController } from "../controllers/taxonomy.controller";

const router = Router();

router.get("/", limiter, TaxonomyController.getAll);
router.get(
  "/:id",
  limiter,
  validateParams(idParamSchema),
  TaxonomyController.getOne,
);

export default router;
