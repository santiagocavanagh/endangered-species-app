import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

// Envuelve un handler async y reenvía cualquier rechazo a next()
export const asyncHandler =
  <Req extends Request = Request>(
    fn: AsyncRequestHandler<Req>,
  ): RequestHandler =>
  (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
