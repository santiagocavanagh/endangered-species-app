import { Router } from "express";
import { validateParams } from "../middleware/validate.middleware";
import { speciesIdParamSchema } from "../schemas/species.schema";
import { TaxonomyController } from "../controllers/taxonomy.controller";

const router = Router();

router.get("/", TaxonomyController.getAll);
router.get(
  "/:id",
  validateParams(speciesIdParamSchema),
  TaxonomyController.getOne,
);

export default router;
