import { Request, Response, NextFunction } from "express";
import { requireUser } from "../utils/require-user.util";
import { AuthService } from "../services/auth.service";
import {
  RegisterBody,
  LoginBody,
  UpdateProfileBody,
} from "../schemas/auth.schema";
import { AuthRequest } from "../types/auth.types";

const service = new AuthService();

export class AuthController {
  //Register
  static async register(
    req: Request<{}, {}, RegisterBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await service.register(req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  //Login
  static async login(
    req: Request<{}, {}, LoginBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await service.login(req.body);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  //Update Profile
  static async updateProfile(
    req: AuthRequest & { body: UpdateProfileBody },
    res: Response,
    next: NextFunction,
  ) {
    try {
      requireUser(req);
      const result = await service.updateProfile(req.user.id, req.body);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
