import type { Request, Response, NextFunction } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import {
  ConversationType,
  type CreateConversationType,
  type GetConversationParamType,
  type GetConversationQueryType,
} from "../schemas/conversation.ts";
import { messageServices } from "../services/messageServices.ts";
import { conversationServices } from "../services/conversationServices.ts";
import { AppError } from "../utils/AppError.ts";
import { Participant } from "../models/Participant.ts";
import { type ConversationDocument } from "../models/Conversation.ts";
import mongoose, { Types } from "mongoose";
import { Message } from "../models/Message.ts";

export const createConversation = async (
  req: Request<ParamsDictionary, any, CreateConversationType>,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();

  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user!.userId;
    const groupAvatar = req.file;

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
          groupAvatar,
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

export const getAllConversations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;

    const conversations = await Participant.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "participants",
          let: { conversationId: "$conversationId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$conversationId", "$$conversationId"] },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userData",
              },
            },
            { $unwind: "$userData" },
            {
              $project: {
                _id: 0,
                avatarUrl: "$userData.avatarUrl",
                lastReadMessageId: 1,
              },
            },
          ],

          as: "lastReadBy",
        },
      },
      {
        $lookup: {
          from: "conversations",
          localField: "conversationId",
          foreignField: "_id",
          as: "conversationData",
        },
      },
      { $unwind: "$conversationData" },
      {
        $lookup: {
          from: "messages",
          let: { lastMessageId: "$conversationData.lastMessage._id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$lastMessageId"] } } },
            {
              $project: {
                _id: 0,
                type: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          as: "lastMessage",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { senderId: "$conversationData.lastMessage.senderId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$senderId"] } } },
            {
              $project: {
                username: 1,
                firstName: 1,
                lastName: 1,
                avatarUrl: 1,
              },
            },
          ],
          as: "lastMessageSender",
        },
      },
      { $unwind: "$lastMessageSender" },
      {
        $project: {
          type: "$conversationData.type",
          role: 1,
          unreadCount: 1,
          lastMessage: "$conversationData.lastMessage",
          lastMessageAt: "$conversationData.lastMessageAt",
          lastMessageSender: "$lastMessageSender",
          lastReadBy: 1,
          createdAt: "$conversationData.createdAt",
          updatedAt: "$conversationData.updatedAt",
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Conversations fetched successfully.",
      conversations,
    });
  } catch (err) {
    console.log("Error occurred while fetching all conversations", err);
    next(err);
  }
};

export const getConversationById = async (
  req: Request<GetConversationParamType, any, any, GetConversationQueryType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { limit, cursor } = req.query;
    const { conversationId } = req.params;

    const query = {
      conversationId,
      ...(cursor && { createdAt: { $lt: new Date(cursor) } }),
    };

    const messages = await Message.find(query).sort({ createdAt: -1 }).lean();

    let nextCursor = null;
    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage?.createdAt.toString() ?? null;
      messages.pop();
    }

    messages.reverse();
    res.json({
      success: true,
      message: "Messages fetched successfully.",
      messages,
      nextCursor,
    });
  } catch (err) {
    console.log("Error occurred while fetching conversation by ID", err);
    next(err);
  }
};
