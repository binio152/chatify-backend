import { User } from "../models/User.ts";
import type { Socket } from "socket.io";
import { jwtVerify } from "../utils/auth.ts";

export const socketAuthentication = async (socket: Socket, next: any) => {
  try {
    const rawToken = socket.handshake.auth?.token;
    const accessToken =
      typeof rawToken === "string" ? rawToken : rawToken?.accessToken;

    if (!accessToken) return next(new Error("Token is not provided"));

    const decoded = jwtVerify(accessToken);
    if (!decoded) return next(new Error("Token is not provided or expired"));

    const user = await User.findById(decoded.userId)
      .select("_id firstName lastName username email")
      .lean();
    if (!user) return next(new Error("User is not exists"));

    socket.user = user;
    next();
  } catch (err) {
    console.log("Error occurred while authenticating socket id", err);
    next(err);
  }
};
