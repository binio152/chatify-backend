import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { SendDirectMessageType } from "../schemas/message.ts";
import {
  Conversation,
  type ConversationDocument,
} from "../models/Conversation.ts";
import { messageServices } from "../services/messageServices.ts";
import mongoose from "mongoose";
import { conversationServices } from "../services/conversationServices.ts";
import { AppError } from "../utils/AppError.ts";
import type { Server } from "socket.io";
import { Message, type MessageDocument } from "../models/Message.ts";
import { Participant } from "../models/Participant.ts";
import { io } from "../socket/index.ts";

export const sendDirectMessage = async (
  req: Request<ParamsDictionary, any, SendDirectMessageType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { recipientId, conversationId, content } = req.body;
    const senderId = req.user!.userId;
    const image = req.file;

    let directConversation: ConversationDocument | null = null;

    if (conversationId) {
      directConversation = await Conversation.findById(conversationId);
    }

    if (!directConversation) {
      directConversation = await messageServices.findDirectConversation(
        senderId,
        recipientId,
      );
    }

    // If the conversation doesn't exist, create a new one
    if (!directConversation) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const result = await conversationServices.createDirectConversation(
            session,
            senderId,
            recipientId,
          );

          directConversation = result.conversation;
        });
      } catch (error) {
        const isDuplicateConversation =
          error instanceof Error &&
          "code" in error &&
          (error as { code?: number }).code === 11000;

        if (!isDuplicateConversation) {
          throw error;
        }

        directConversation = await messageServices.findDirectConversation(
          senderId,
          recipientId,
        );
      } finally {
        session.endSession();
      }
    }

    if (!directConversation) {
      return next(new AppError("Unable to create direct conversation.", 500));
    }

    const { message, messagePreview } =
      await messageServices.createOutgoingMessage({
        conversationId: directConversation._id,
        senderId,
        ...(content && { content }),
        ...(image && { file: image }),
      });

    const { conversation: updatedConversation } =
      await messageServices.updateConversationAfterSendMessage(
        directConversation,
        message,
        senderId,
        messagePreview,
      );

    emitNewMessage(io, updatedConversation, message);

    return res.status(201).json({
      success: true,
      message: "Direct message sent successfully.",
      data: { message, conversation: updatedConversation },
    });
  } catch (err) {
    console.log("Error occurred while sending direct message.", err);
    next(err);
  }
};

export const sendGroupMessage = async (
  req: Request<ParamsDictionary, any, SendDirectMessageType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const senderId = req.user!.userId;
    const groupConversation = req.conversation!;
    const content = req.body.content;
    const image = req.file;

    const { message, messagePreview } =
      await messageServices.createOutgoingMessage({
        conversationId: groupConversation._id,
        senderId,
        ...(content && { content }),
        ...(image && { file: image }),
      });

    const { conversation: updatedConversation } =
      await messageServices.updateConversationAfterSendMessage(
        groupConversation,
        message,
        senderId,
        messagePreview,
      );

    emitNewMessage(io, updatedConversation, message);

    return res.status(201).json({
      success: true,
      message: "Group message sent successfully.",
      data: { message, conversation: updatedConversation },
    });
  } catch (err) {
    console.log("Error occurred while sending group message.", err);
    next(err);
  }
};

export const markConversationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user!.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError("Conversation not found.", 404));
    }

    const participant = await Participant.findOne({
      conversationId: conversation._id,
      userId,
    });

    if (!participant) {
      return next(new AppError("You are not a participant in this conversation.", 403));
    }

    const latestMessage = await Message.findOne({ conversationId: conversation._id })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    if (!latestMessage) {
      await Participant.updateOne(
        { conversationId: conversation._id, userId },
        { $set: { lastReadMessageId: null, unreadCount: 0 } },
      );

      return res.status(200).json({
        success: true,
        message: "Conversation marked as read.",
        data: { conversationId: conversation._id, messageIds: [] },
      });
    }

    const readByUserId = new mongoose.Types.ObjectId(userId);
    const affectedMessages = await Message.find({
      conversationId: conversation._id,
      senderId: { $ne: readByUserId },
      createdAt: { $lte: latestMessage.createdAt },
    }).select("_id");

    const messageIds = affectedMessages.map((message) => message._id.toString());

    await Promise.all([
      Participant.updateOne(
        { conversationId: conversation._id, userId },
        {
          $set: {
            lastReadMessageId: latestMessage._id,
            unreadCount: 0,
          },
        },
      ),
      Message.updateMany(
        {
          conversationId: conversation._id,
          _id: { $in: affectedMessages.map((message) => message._id) },
          readBy: { $ne: readByUserId },
        },
        { $addToSet: { readBy: readByUserId } },
      ),
    ]);

    io.to(conversation._id.toString()).emit("message-read", {
      conversationId: conversation._id.toString(),
      readerId: userId,
      messageIds,
    });

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read.",
      data: { conversationId: conversation._id, messageIds },
    });
  } catch (err) {
    console.log("Error occurred while marking conversation as read.", err);
    next(err);
  }
};

export const emitNewMessage = (
  io: Server,
  conversation: ConversationDocument,
  message: MessageDocument,
) => {
  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      messagePreview: conversation.messagePreview,
    },
  });
};
