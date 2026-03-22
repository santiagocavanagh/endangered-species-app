import { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors/app.error";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  console.error("UNHANDLED ERROR:", err);

  return res.status(500).json({
    message: "Internal Server Error",
  });
};
