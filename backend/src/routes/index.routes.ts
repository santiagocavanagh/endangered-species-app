// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth.routes";
import favoriteRoutes from "./favorite.routes";
import speciesRoutes from "./species.routes";
import regionRoutes from "./region.routes";
import taxonomyRoutes from "./taxonomy.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/species", speciesRoutes);
router.use("/regions", regionRoutes);
router.use("/taxonomies", taxonomyRoutes);

export default router;
