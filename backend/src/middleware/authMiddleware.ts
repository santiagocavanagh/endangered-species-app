import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "clave";

export const authenticateToken = (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Acceso denegado. No hay token." });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err)
      return res.status(403).json({ error: "Token inválido o expirado." });

    req.user = user;
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
