import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.ts";
import { friendServices } from "../services/friendServices.ts";
import type { SendDirectMessageType } from "../schemas/message.ts";
import type { ParamsDictionary } from "express-serve-static-core";
import { User } from "../models/User.ts";
import { Conversation } from "../models/Conversation.ts";
import { Participant } from "../models/Participant.ts";

export const requireFriendship = async (
  req: Request<ParamsDictionary, any, SendDirectMessageType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const senderId = req.user!.userId;
    const { recipientId } = req.body;

    // Check if the sender and recipient IDs are provided
    if (!recipientId || !senderId)
      return next(new AppError("Sender and recipient IDs are required.", 400));

    // Check if the recipient exists
    const recipient = await User.exists({ _id: recipientId });
    if (!recipient) return next(new AppError("Recipient not found.", 404));

    // Check if the users are friends
    const isFriend = await friendServices.checkFriendshipStatus(
      senderId,
      recipientId,
    );
    if (!isFriend)
      return next(new AppError("You are not friends with this user.", 403));

    next();
  } catch (err) {
    console.log("Error occurred while checking friendship", err);
    next(err);
  }
};

export const requireMessageContentOrImage = async (
  req: Request<ParamsDictionary, any, SendDirectMessageType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate that the message has either content or an image
    const hasContent =
      typeof req.body?.content === "string" &&
      req.body.content.trim().length > 0;

    const hasImage = Boolean(req.file);

    if (!hasContent && !hasImage)
      return next(
        new AppError("Message must contain either text or an image.", 400),
      );

    next();
  } catch (err) {
    console.log("Error occurred while checking friendship", err);
    next(err);
  }
};

export const requireGroupMembership = async (
  req: Request<ParamsDictionary, any, SendDirectMessageType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.body;
    const senderId = req.user!.userId;

    if (!conversationId)
      return next(
        new AppError(
          "Conversation ID is required while sending group message",
          400,
        ),
      );

    const [conversation, isMember] = await Promise.all([
      Conversation.findById(conversationId),
      Participant.exists({ userId: senderId, conversationId }),
    ]);

    if (!conversation)
      return next(new AppError("Conversation does not exist", 404));

    if (!isMember)
      return next(new AppError("You are not a participant in this group", 403));

    req.conversation = conversation;
    next();
  } catch (err) {
    console.log("Error occurred while checking group membership", err);
    next(err);
  }
};
