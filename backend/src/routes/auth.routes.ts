import { AuthController } from "../controllers/auth.controller";
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  limiter,
  loginLimiter,
  registerLimiter,
} from "../middleware/rate.limiter";

const router = Router();
// RUTAS
router.post("/register", registerLimiter, AuthController.register);
router.post("/login", loginLimiter, AuthController.login);

router.put(
  "/update-profile",
  authenticateToken,
  limiter,
  AuthController.updateProfile,
);

export default router;
