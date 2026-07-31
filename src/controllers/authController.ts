import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { User } from "../models/User.ts";
import { AppError } from "../utils/AppError.ts";
import {
  comparePassword,
  generateRefreshToken,
  hashPassword,
  jwtSign,
} from "../utils/auth.ts";
import { env } from "node:process";
import { Session } from "../models/Session.ts";
import { calculateExpiresAt } from "../utils/time.ts";
import type { StringValue } from "ms";
import ms from "ms";
import { isProd } from "../configs/env.ts";
import type { CreateUserType, SignInType } from "../schemas/user.ts";

export const signup = async (
  req: Request<ParamsDictionary, any, CreateUserType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    const isUserExist = await User.findOne({ $or: [{ email }, { username }] });
    if (isUserExist)
      return next(
        new AppError(
          isUserExist.username === username
            ? "This username is already taken."
            : "Your email is already registered.",
          409,
        ),
      );

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created user successfully.", user });
  } catch (err) {
    console.log("Error occurred while signing up.", err);
    next(err);
  }
};

export const signin = async (
  req: Request<ParamsDictionary, any, SignInType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { indentifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: indentifier }, { email: indentifier }],
    }).select("+password");
    if (!user)
      return next(new AppError("Incorrect username/email or password.", 401));

    const { password: userPassword, ...userWithoutPassword } = user;

    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch)
      return next(new AppError("Incorrect username/email or password.", 401));

    const accessToken = jwtSign({ userId: user._id }, { issuer: "chatify" });
    const refreshToken = generateRefreshToken();
    const refreshTokenTTL = env.REFRESH_TOKEN_EXPIRES_IN as StringValue;

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: calculateExpiresAt(refreshTokenTTL),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd(),
      sameSite: isProd() ? "none" : "lax",
      maxAge: ms(refreshTokenTTL),
    });

    return res.status(200).json({
      success: true,
      message: `User ${user.username} logged in successfully`,
      user,
      accessToken,
    });
  } catch (err) {
    console.log("Error occurred while signing in.", err);
    next(err);
  }
};

export const signout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) await Session.deleteOne({ refreshToken });
    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json({ success: true, message: "User signed out successfully." });
  } catch (err) {
    console.log("Error occurred while signing out.", err);
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return next(new AppError("Token is not provided", 401));

    const session = await Session.findOne({ refreshToken });
    if (!session) return next(new AppError("Token is invalid or expired", 401));

    if (session.expiresAt < new Date())
      return next(new AppError("Token is expired", 401));

    const accessToken = jwtSign(
      { userId: session.userId },
      { issuer: "chatify" },
    );

    return res
      .status(200)
      .json({
        success: true,
        message: "Refreshed token successfully",
        accessToken,
      });
  } catch (err) {
    console.log("Error occurred while refreshing token.", err);
    next(err);
  }
};
