import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { ENV } from "../config/env.config";
import { AuthRequest, TokenPayload } from "../types/auth.types";
import { UserRole } from "../entities/user.entity";
import { UnauthorizedError, ForbiddenError } from "../errors/http.error";

function isTokenPayload(payload: unknown): payload is TokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as any).id === "number" &&
    typeof (payload as any).email === "string" &&
    typeof (payload as any).role === "string"
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

    if (!Object.values(UserRole).includes(decoded.role)) {
      throw new ForbiddenError("Rol inválido");
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
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
