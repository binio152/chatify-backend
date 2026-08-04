import { JwtPayload } from "jsonwebtoken";
import type { ObjectId } from "mongoose";
import type { ConversationDocument } from "../models/Conversation.ts";

export interface SignJwtPayload extends JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SignJwtPayload;
      conversation?: ConversationDocument
    }
  }
}
