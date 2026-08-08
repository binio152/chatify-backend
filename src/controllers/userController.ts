import type { Request, Response, NextFunction } from "express";
import { User } from "../models/User.ts";
import { AppError } from "../utils/AppError.ts";
import { cloudinaryServices } from "../services/cloudinaryServices.ts";
import type { UploadApiResponse } from "cloudinary";

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).lean();
    if (!user) return next(new AppError("User not found.", 404));

    console.log(userId);

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

export const searchUsersByIdentifier = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const identifier = String(req.query.identifier ?? "").trim();
    if (!identifier) {
      return next(new AppError("Identifier is required.", 400));
    }

    const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${escapedIdentifier}$`, "i") },
        { email: new RegExp(`^${escapedIdentifier}$`, "i") },
      ],
      _id: { $ne: req.user!.userId },
    })
      .select("_id username email firstName lastName avatarUrl")
      .lean();

    if (!user) {
      return next(new AppError("No user found with that username or email.", 404));
    }

    return res.status(200).json({
      success: true,
      message: "User found successfully.",
      user,
    });
  } catch (err) {
    console.log("Error occurred while searching user by identifier.", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    console.log(userId);

    const user = await User.findById(userId);
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

// Update current user's profile
export const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const payload = req.body ?? {};

    // Only allow certain fields to be updated
    const allowed: Record<string, any> = {};
    const fields = ["firstName", "lastName", "username", "email", "bio", "avatarUrl"];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(payload, f)) {
        allowed[f] = payload[f];
      }
    }

    // Basic uniqueness checks for username/email
    if (allowed.username) {
      const exists = await User.findOne({ username: allowed.username, _id: { $ne: userId } }).lean();
      if (exists) return next(new AppError("Username already taken.", 409));
    }

    if (allowed.email) {
      const exists = await User.findOne({ email: allowed.email, _id: { $ne: userId } }).lean();
      if (exists) return next(new AppError("Email already in use.", 409));
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: allowed }, { new: true });
    if (!updated) return next(new AppError("User not found.", 404));

    return res.status(200).json({ success: true, message: "Profile updated.", user: updated });
  } catch (err) {
    console.log("Error occurred while updating profile.", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Upload avatar (returns avatarUrl) - expects multer to populate req.file
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file || !file.buffer) return next(new AppError("No file uploaded.", 400));

    const result = (await cloudinaryServices.uploadUserAvtar(file.buffer)) as UploadApiResponse;
    if (!result || !result.url) {
      console.log("Cloudinary upload responded without URL:", result);
      return res.status(500).json({ success: false, message: "Failed to upload avatar." });
    }

    // Return avatarUrl for client to attach to profile update
    return res.status(200).json({ success: true, avatarUrl: result.url });
  } catch (err) {
    console.log("Error occurred while uploading avatar.", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
