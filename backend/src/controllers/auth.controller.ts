import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthRequest } from "../types/auth.types";
import {
  RegisterBody,
  LoginBody,
  UpdateProfileBody,
} from "../schemas/auth.schema";

const service = new AuthService();

export class AuthController {
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

  static async updateProfile(
    req: AuthRequest & { body: UpdateProfileBody },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await service.updateProfile(req.user!.id, req.body);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
