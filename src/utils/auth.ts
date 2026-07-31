import bcrypt from "bcrypt";
import env from "../configs/env.ts";
import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";

export interface SignJwtPayload extends JwtPayload {
  userId: string;
}

export const jwtSign = (payload: jwt.JwtPayload, options?: jwt.SignOptions) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    ...options,
  });
};

export const jwtVerify = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as SignJwtPayload;
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
) => {
  return bcrypt.compare(password, hashedPassword);
};
