import { Response, NextFunction } from "express";
import { ENV } from "../config/env.config";
import { AuthRequest } from "../types/auth.types";
import jwt from "jsonwebtoken";

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Acceso denegado. No hay token." });

  jwt.verify(token, ENV.JWT_SECRET as string, (err, decoded: any) => {
    if (err)
      return res.status(403).json({ error: "Token inválido o expirado." });

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  });
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ error: "Acceso denegado. Se requiere rol de Administrador." });
  }
};
