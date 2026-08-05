import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { SendDirectMessageType } from "../schemas/message.ts";
import { Conversation } from "../models/Conversation.ts";
import { Participant } from "../models/Participant.ts";
import { messageServices } from "../services/messageServices.ts";

export const sendDirectMessage = async (
  req: Request<ParamsDictionary, any, SendDirectMessageType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { recipientId, conversationId, content } = req.body;
    const senderId = req.user!.userId;
    const image = req.file;

    let directConversation =
      (conversationId && (await Conversation.findById(conversationId))) ??
      (await messageServices.findDirectConversation(senderId, recipientId));

    // If the conversation doesn't exist, create a new one
    if (!directConversation) {
      directConversation = await Conversation.create({ type: "direct" });

      await Participant.create([
        { userId: senderId, conversationId: directConversation._id },
        { userId: recipientId, conversationId: directConversation._id },
      ]);
    }

    const { message, messagePreview } =
      await messageServices.createOutgoingMessage({
        conversationId: directConversation._id,
        senderId,
        ...(content && { content }),
        ...(image && { file: image }),
      });

    await messageServices.updateConversationAfterSendMessage(
      directConversation,
      message,
      senderId,
      messagePreview,
    );

    return res.status(201).json({
      success: true,
      message: "Direct message sent successfully.",
      data: { message, conversation: directConversation },
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

    const { message, messagePreview } = await messageServices.createOutgoingMessage({
      conversationId: groupConversation._id,
      senderId,
      ...(content && { content }),
      ...(image && { file: image }),
    });

    await messageServices.updateConversationAfterSendMessage(
      groupConversation,
      message,
      senderId,
      messagePreview,
    );

    return res.status(201).json({
      success: true,
      message: "Group message sent successfully.",
      data: { message, conversation: groupConversation },
    });
  } catch (err) {
    console.log("Error occurred while sending group message.", err);
    next(err);
  }
};
