import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.ts";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(new AppError(`Can not ${req.method} ${req.originalUrl}`, 404));
};
