import type { Request, Response, NextFunction } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import {
  ConversationType,
  UserRole,
  type CreateConversationType,
} from "../schemas/conversation.ts";
import { messageServices } from "../services/messageServices.ts";
import { conversationServices } from "../services/conversationServices.ts";
import { AppError } from "../utils/AppError.ts";
import {
  Participant,
  type ParticipantDocument,
} from "../models/Participant.ts";
import {
  Conversation,
  type ConversationDocument,
} from "../models/Conversation.ts";
import mongoose from "mongoose";

export const createConversation = async (
  req: Request<ParamsDictionary, any, CreateConversationType>,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();

  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user!.userId;
    console.log(userId);

    let conversation: ConversationDocument | null = null;

    let successMessage = "";

    if (type === ConversationType.DIRECT) {
      const participant = memberIds[0]!;
      console.log(participant);

      conversation = await messageServices.findDirectConversation(
        userId,
        participant,
      );
      console.log(conversation);

      if (conversation)
        return next(
          new AppError("This direct conversation already exists.", 400),
        );

      await session.withTransaction(async () => {
        const result = await conversationServices.createDirectConversation(
          session,
          userId,
          participant,
        );
        conversation = result.conversation;
      });

      successMessage = "Direct conversation created successfully.";
    }

    if (type === ConversationType.GROUP) {
      await session.withTransaction(async () => {
        const result = await conversationServices.createGroupConversation(
          session,
          name as string,
          userId,
          memberIds,
        );
        conversation = result.conversation;
      });

      successMessage = "Group conversation created successfully.";
    }

    return res.status(201).json({
      success: true,
      message: successMessage,
      conversation,
    });
  } catch (err) {
    console.log("Error occurred while creating conversation", err);
    next(err);
  } finally {
    session.endSession();
  }
};

