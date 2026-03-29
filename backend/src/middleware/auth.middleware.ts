import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { ENV } from "../config/env.config";
import { AuthRequest, TokenPayload } from "../types/auth.types";
import { User, UserRole } from "../entities/user.entity";
import { UnauthorizedError, ForbiddenError } from "../errors/http.error";
import { AppDataSource } from "../config/data.source";

function isTokenPayload(payload: unknown): payload is TokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    "email" in payload &&
    "role" in payload &&
    "passwordChangedAt" in payload
  );
}

export const authenticateToken = async (
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

    const user = await AppDataSource.getRepository(User).findOneBy({
      id: decoded.id,
    });

    if (!user) {
      throw new ForbiddenError("Usuario no existe");
    }

    const currentPasswordChangedAt = user.passwordChangedAt?.getTime() ?? 0;

    if (decoded.passwordChangedAt < currentPasswordChangedAt) {
      throw new ForbiddenError("Token inválido por cambio de contraseña");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
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
