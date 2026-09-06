import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { AuthController } from "../controllers/auth.controller";
import {
  limiter,
  loginLimiter,
  registerLimiter,
} from "../middleware/rate.limiter";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../schemas/auth.schema";
import { validateBody } from "../middleware/validate.middleware";

const router = Router();

router.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  AuthController.register,
);
router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  AuthController.login,
);

router.put(
  "/update-profile",
  authenticateToken,
  limiter,
  validateBody(updateProfileSchema),
  AuthController.updateProfile,
);

export default router;
