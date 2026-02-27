import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { ENV } from "../config/env.config";
import { AuthRequest, TokenPayload } from "../types/auth.types";

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;

    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(403).json({ error: "Token inválido" });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Se requiere rol de administrador",
    });
  }

  next();
};
