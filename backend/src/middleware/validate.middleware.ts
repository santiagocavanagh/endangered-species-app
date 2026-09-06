import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validateBody =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };

export const validateParams =
  <T extends Record<string, unknown>>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      Object.assign(req.params, parsed);
      next();
    } catch (error) {
      next(error);
    }
  };

export const validateQuery =
  <T extends Record<string, unknown>>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      Object.assign(req.query, parsed);
      next();
    } catch (error) {
      next(error);
    }
  };
