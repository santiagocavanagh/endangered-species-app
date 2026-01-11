import { Router } from "express";
import { speciesController } from "../controllers/speciesController";

const router = Router();

router.get("/", speciesController.getAll);

export default router;