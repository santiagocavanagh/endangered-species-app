import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { ENV } from "../config/env.config";
import { AuthRequest, TokenPayload } from "../types/auth.types";
import { UserRole } from "../entities/user.entity";
import { UnauthorizedError, ForbiddenError } from "../errors/http.error";

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

function isTokenPayload(payload: unknown): payload is TokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    "email" in payload &&
    "role" in payload
  );
}

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

    const token = authHeader.slice(7);

    if (!token) {
      throw new UnauthorizedError("Token mal formado");
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    if (!isTokenPayload(decoded)) {
      throw new ForbiddenError("Token inválido");
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as UserRole,
    };

    next();
  } catch {
    next(new ForbiddenError("Token inválido o expirado"));
  }
};
