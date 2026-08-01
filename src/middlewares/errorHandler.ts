import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.ts";
import multer from "multer";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.log(err);

  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }

  if (err instanceof multer.MulterError) {
    console.log("Multer error:", err); // DEV ONLY
    return res.status(400).json({ success: false, message: err.message });
  }

  return res
    .status(500)
    .json({ success: false, message: "Internal Server Error" });
};
