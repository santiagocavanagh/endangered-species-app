import { Router } from "express";
import { validateParams } from "../middleware/validate.middleware";
import { speciesIdParamSchema } from "../schemas/species.schema";
import { RegionController } from "../controllers/region.controller";

const router = Router();

router.get("/", RegionController.getAll);
router.get(
  "/:id",
  validateParams(speciesIdParamSchema),
  RegionController.getOne,
);

export default router;
