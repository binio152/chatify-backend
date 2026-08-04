import type { ParamsDictionary } from "express-serve-static-core";
import type { NextFunction, Request, Response } from "express";
import type { CreateConversationType } from "../schemas/conversation.ts";
import { User } from "../models/User.ts";
import { AppError } from "../utils/AppError.ts";
import { friendServices } from "../services/friendServices.ts";
import { Friend } from "../models/Friend.ts";

export const requireAllMembersAreFriends = async (
  req: Request<ParamsDictionary, any, CreateConversationType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { memberIds } = req.body;
    const userId = req.user!.userId;

    if (!memberIds) return next(new AppError("Member IDs are required", 400));

    const conditions = memberIds.map((memberId) => {
      const [userA, userB] = friendServices.pairUsers(memberId, userId);
      return { userA, userB };
    });

    const friends = await Friend.find({ $or: conditions });

    const friendIds = new Set<string>();

    for (const friend of friends) {
      if (friend.userA.toString() === userId) {
        friendIds.add(friend.userB.toString());
      } else {
        friendIds.add(friend.userA.toString());
      }
    }

    const notFriendIds = memberIds.filter((id) => !friendIds.has(id));

    const notFriends = await User.find({ _id: { $in: notFriendIds } })
      .select("_id firstName lastName username avatarUrl")
      .lean();

    if (notFriends.length > 0)
      next(
        new AppError(
          "You are not friends with the following users: " +
            notFriends.map((user) => user.username).join(", "),
          403,
        ),
      );

    next();
  } catch (err) {
    console.log("Error occurred while checking friendship", err);
    next(err);
  }
};

export const validateConversationBody = (
  req: Request<ParamsDictionary, any, CreateConversationType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user!.userId;

    if (type === "group" && (!name || name.trim() === ""))
      return next(new AppError("Group conversations require a name.", 400));

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0)
      return next(
        new AppError(
          "Member IDs are required and must be a non-empty array.",
          400,
        ),
      );

    if (memberIds.includes(userId))
      return next(
        new AppError("You cannot add yourself to the conversation.", 400),
      );

    if (type === "direct" && memberIds.length !== 1)
      return next(
        new AppError(
          "Direct conversations must have exactly one member ID.",
          400,
        ),
      );

    next();
  } catch (err) {
    console.log("Error occurred while validating conversation body", err);
    next(err);
  }
};
