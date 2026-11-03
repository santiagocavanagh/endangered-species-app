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
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getClearAuthCookieOptions,
} from "../constants/auth.constant";

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
      const { token, ...publicData } = await service.login(req.body);

      // El JWT viaja solo por Set-Cookie (httpOnly): nunca se expone en el body de la
      // respuesta, de lo contrario cualquier JS con acceso al fetch() podría leerlo igual.
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      res.json(publicData);
    },
  );

  static logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());
    res.json({ message: "Sesión cerrada" });
  });

  // Sesión actual (rehidratación del frontend sin exponer el token)
  static me = asyncHandler(async (req: AuthRequest, res: Response) => {
    requireUser(req);
    const result = await service.me(req.user.id);
    res.json(result);
  });

  static updateProfile = asyncHandler(
    async (req: AuthRequest & { body: UpdateProfileBody }, res: Response) => {
      requireUser(req);
      const result = await service.updateProfile(req.user.id, req.body);
      res.json(result);
    },
  );
}
