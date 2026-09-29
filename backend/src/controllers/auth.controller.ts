import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.util";
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
  static register = asyncHandler(
    async (req: Request<{}, {}, RegisterBody>, res: Response) => {
      const result = await service.register(req.body);
      res.status(201).json(result);
    },
  );

  static login = asyncHandler(
    async (req: Request<{}, {}, LoginBody>, res: Response) => {
      const result = await service.login(req.body);
      res.json(result);
    },
  );

  static updateProfile = asyncHandler(
    async (req: AuthRequest & { body: UpdateProfileBody }, res: Response) => {
      requireUser(req);
      const result = await service.updateProfile(req.user.id, req.body);
      res.json(result);
    },
  );
}
