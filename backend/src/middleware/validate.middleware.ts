import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validateBody =
  <T>(schema: ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: "Cuerpo de la solicitud no valido",
        details: error.errors,
      });
    }
  };

export const validateParams =
  <T>(schema: ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      (req as any).params = parsed;
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: "Parametros no validos",
        details: error.errors,
      });
    }
  };

export const validateQuery =
  <T>(schema: ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      (req as any).query = parsed;
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: "Consulta no valida",
        details: error.errors,
      });
    }
  };
