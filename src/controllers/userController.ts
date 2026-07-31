import type { Request, Response, NextFunction } from "express";
import { User } from "../models/User.ts";
import { AppError } from "../utils/AppError.ts";

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return next(new AppError("User not found.", 404));

    return res.status(200).json({
      success: true,
      message: `Get User ${user._id} successfully`,
      user,
    });
  } catch (err) {
    console.log("Error occurred while fetching user by ID.", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId).select("-password");
    if (!user) return next(new AppError("User not found.", 404));

    return res.status(200).json({
      success: true,
      message: `Get User ${user._id} successfully`,
      user,
    });
  } catch (err) {
    console.log("Error occurred while fetching user by ID.", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};
