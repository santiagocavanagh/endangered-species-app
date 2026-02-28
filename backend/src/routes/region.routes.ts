import { Router } from "express";
import { RegionController } from "../controllers/region.controller";

const router = Router();

router.get("/", RegionController.getAll);
router.get("/:id", RegionController.getOne);

export default router;
