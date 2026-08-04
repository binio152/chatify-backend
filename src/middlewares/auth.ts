import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.ts";
import { jwtVerify } from "../utils/auth.ts";

export const authenticationToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return next(new AppError("Access token is required.", 401));

    const payload = jwtVerify(token);
    console.log(payload); // DEV ONLY

    req.user = payload;

    next();
  } catch (err) {
    console.log("Error occurred while validation authentication token", err);
    next(new AppError("Invalid or expired access token.", 401));
  }
};
