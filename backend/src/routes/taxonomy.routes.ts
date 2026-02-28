import { Router } from "express";
import { TaxonomyController } from "../controllers/taxonomy.controller";

const router = Router();

router.get("/", TaxonomyController.getAll);
router.get("/:id", TaxonomyController.getOne);

export default router;
