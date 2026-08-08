import { Socket } from "socket.io";
import { Types } from "mongoose";

interface UserPayload {
  _id: Types.ObjectId;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null | undefined;
  avatarId?: string | null | undefined;
  bio?: string | null | undefined;
  phone?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

declare module "socket.io" {
  interface Socket {
    user?: UserPayload;
  }
}
