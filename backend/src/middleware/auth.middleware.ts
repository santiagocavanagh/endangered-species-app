import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { ENV } from "../config/env.config";
import { AuthRequest, TokenPayload } from "../types/auth.types";
import { UserRole } from "../entities/user.entity";
import { UnauthorizedError, ForbiddenError } from "../errors/http.error";

export const authenticateToken = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token requerido");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;

    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new ForbiddenError("Token inválido");
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as UserRole,
    };

    next();
  } catch (error) {
    next(new ForbiddenError("Token inválido o expirado"));
  }
};

export const isAdmin = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new UnauthorizedError("No autenticado"));
  }

  if (req.user.role !== UserRole.ADMIN) {
    return next(new ForbiddenError("Se requiere rol de administrador"));
  }

  next();
};
