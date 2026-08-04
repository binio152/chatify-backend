import {
  Conversation,
  type ConversationDocument,
} from "../models/Conversation.ts";
import { Message } from "../models/Message.ts";
import { User } from "../models/User.ts";
import { cloudinaryServices } from "./cloudinaryServices.ts";
import type { MessageDocument } from "../models/Message.ts";
import { Participant } from "../models/Participant.ts";
import type { UploadApiResponse } from "cloudinary";
import { Types } from "mongoose";

export type PrepareOutgoingMessageInput = {
  conversationId: ConversationDocument["_id"];
  senderId: string;
  content?: string;
  file?: Express.Multer.File;
};

export const messageServices = {
  uploadMessageAttachment: async (file?: Express.Multer.File) => {
    if (!file) return undefined;

    const uploaded = await cloudinaryServices.sendMessageImage(file.buffer);
    return (uploaded as UploadApiResponse).url;
  },

  buildMessagePreview: async ({
    content,
    senderId,
  }: {
    content?: string;
    senderId: string;
  }) => {
    if (content) {
      return content.length > 36 ? `${content.slice(0, 36)}...` : content;
    }

    const sender = await User.findById(senderId).select("lastName").lean();
    return `${sender?.lastName ?? "User"} has sent an image.`;
  },

  createOutgoingMessage: async ({
    conversationId,
    senderId,
    content,
    file,
  }: PrepareOutgoingMessageInput) => {
    const imageUrl = await messageServices.uploadMessageAttachment(file);

    const message = await Message.create({
      conversationId,
      senderId,
      ...(content && { content }),
      ...(imageUrl && { imageUrl }),
    });

    const preview = await messageServices.buildMessagePreview({
      ...(content && { content }),
      senderId,
    });

    return { message, preview };
  },

  updateConversationAfterSendMessage: async (
    conversation: ConversationDocument,
    message: MessageDocument,
    senderId: string,
    preview: string | null,
  ) => {
    const lastMessage = {
      _id: message._id,
      senderId: message.senderId,
      content: message.content ?? null,
      createdAt: message.createdAt,
    };

    conversation.set({
      lastMessage,
      lastMessageAt: message.createdAt,
      preview,
    });

    await conversation.save();

    await Promise.all([
      Participant.updateOne(
        { conversationId: conversation._id, userId: senderId },
        { $set: { lastReadMessageId: message._id } },
      ),
      Participant.updateMany(
        {
          conversationId: conversation._id,
          userId: { $ne: senderId },
        },
        { $inc: { unreadCount: 1 } },
      ),
    ]);

    const participants = await Participant.find({
      conversationId: conversation._id,
    }).select("userId unreadCount lastReadMessageId");

    return { conversation, participants };
  },

  findDirectConversation: async (senderId: string, recipientId: string) => {
    const senderObjectId = new Types.ObjectId(senderId);
    const recipientObjectId = new Types.ObjectId(recipientId);

    const [directConversation] = await Participant.aggregate([
      {
        $match: {
          userId: { $in: [senderObjectId, recipientObjectId] },
        },
      },
      {
        $group: {
          _id: "$conversationId",
          users: { $addToSet: "$userId" },
        },
      },
      {
        $match: {
          users: { $all: [senderObjectId, recipientObjectId] },
        },
      },
      { $limit: 1 },
    ]);

    if (!directConversation) return null;

    return Conversation.findOne({
      _id: directConversation._id,
      type: "direct",
    });
  },
};
