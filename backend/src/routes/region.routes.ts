import { Router } from "express";
import { limiter } from "../middleware/rate.limiter";
import { validateParams } from "../middleware/validate.middleware";
import { speciesIdParamSchema } from "../schemas/species.schema";
import { RegionController } from "../controllers/region.controller";

const router = Router();

router.get("/", limiter, RegionController.getAll);
router.get(
  "/:id",
  limiter,
  validateParams(speciesIdParamSchema),
  RegionController.getOne,
);

export default router;
