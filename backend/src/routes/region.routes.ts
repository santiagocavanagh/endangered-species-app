import { Router } from "express";
import { limiter } from "../middleware/rate.limiter";
import { validateParams } from "../middleware/validate.middleware";
import { idParamSchema } from "../schemas/common.schema";
import { RegionController } from "../controllers/region.controller";

const router = Router();

router.get("/", limiter, RegionController.getAll);
router.get(
  "/:id",
  limiter,
  validateParams(idParamSchema),
  RegionController.getOne,
);

export default router;
