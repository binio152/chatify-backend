import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { AppError } from "../utils/AppError.ts";
import type {
  FriendRequestIdType,
  SendFriendRequestType,
} from "../schemas/friend.ts";
import { FriendRequest } from "../models/FriendRequest.ts";
import { friendServices } from "../services/friendServices.ts";
import { User } from "../models/User.ts";
import { userSelectFields } from "../constants/index.ts";

export const sendFriendRequest = async (
  req: Request<ParamsDictionary, any, SendFriendRequestType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const from = req.user!.userId; // The userId passed in the authentication token
    const { to, message = null } = req.body;

    // Validate the request data
    if (!from || !to) return next(new AppError("Invalid request data.", 401));

    if (from.toString() === to.toString())
      return next(new AppError("You can't send a request to yourself.", 401));

    // Check if the users are already friends
    const isFriend = await friendServices.checkFriendshipStatus(from, to);
    if (isFriend) return next(new AppError("You are already friends.", 401));

    // Check if a friend request already exists
    const existingRequest = await FriendRequest.findOne({ from, to });
    if (existingRequest)
      return next(new AppError("You have already sent this request.", 401));

    // If a reverse request exists, accept it automatically
    const reverseRequest = await FriendRequest.findOne({ from: to, to: from });
    if (reverseRequest) {
      await friendServices.acceptFriendRequest(
        from,
        to,
        reverseRequest._id.toString(),
      );

      return res.status(201).json({
        success: true,
        message:
          "You have received a friend request from this user. \
           The request has been automatically accepted.",
      });
    }

    // Create a new friend request
    const request = await FriendRequest.create({ from, to, message });

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully.",
      request,
    });
  } catch (err) {
    console.log("Error occurred while sending friend request.", err);
    next(err);
  }
};

export const acceptFriendRequest = async (
  req: Request<FriendRequestIdType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const userId = req.user!.userId; // The userId passed in the authentication token

    // Check if the friend request exists and belongs to the authenticated user
    const request = await FriendRequest.findById(requestId);
    if (!request) return next(new AppError("Friend request not found.", 401));

    if (request.to.toString() !== userId.toString())
      return next(new AppError("You cannot accept this friend request.", 403));

    // Fetch the user who sent the friend request
    const from = await User.findById(request.from)
      .select(userSelectFields)
      .lean();
    if (!from)
      return next(new AppError("You cannot accept this friend request.", 403));

    // Accept the friend request and create a new friend relationship
    const [friend, friendRequest] = await friendServices.acceptFriendRequest(
      request.from.toString(),
      request.to.toString(),
      requestId,
    );

    return res.status(200).json({
      success: true,
      message: "Friend request accepted successfully.",
      newFriend: {
        _id: from._id,
        firstName: from.firstName,
        lastName: from.lastName,
        avatarUrl: from.avatarUrl,
      },
      friend,
      friendRequest,
    });
  } catch (err) {
    console.log("Error occurred while accepting friend request.", err);
    next(err);
  }
};

export const declineFriendRequest = async (
  req: Request<FriendRequestIdType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const userId = req.user!.userId; // The userId passed in the authentication token

    // Check if the friend request exists and belongs to the authenticated user
    const request = await FriendRequest.findById(requestId);
    if (!request) return next(new AppError("Friend request not found.", 401));

    if (request.to.toString() !== userId.toString())
      return next(new AppError("You cannot decline this friend request.", 403));

    await FriendRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      success: true,
      message: `Friend request ${request._id} declined successfully.`,
    });
  } catch (err) {
    console.log("Error occurred while declining friend request.", err);
    next(err);
  }
};

export const cancelFriendRequest = async (
  req: Request<FriendRequestIdType>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const userId = req.user!.userId; // The userId passed in the authentication token

    // Check if the friend request exists and belongs to the authenticated user
    const request = await FriendRequest.findById(requestId);
    if (!request) return next(new AppError("Friend request not found.", 401));

    if (request.from.toString() !== userId.toString())
      return next(new AppError("You cannot cancel this friend request.", 403));

    await FriendRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      success: true,
      message: `Friend request ${request._id} canceled successfully.`,
    });
  } catch (err) {
    console.log("Error occurred while canceling friend request.", err);
    next(err);
  }
};

export const getFriendLists = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId; // The userId passed in the authentication token

    const friendLists = await friendServices.getFriendList(userId);

    return res.status(200).json({
      success: true,
      message: "Friend lists fetched successfully.",
      friendLists,
    });
  } catch (err) {
    console.log("Error occurred while fetching friend lists.", err);
    next(err);
  }
};

export const getFriendRequestLists = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId; // The userId passed in the authentication token

    const [sentRequests, receivedRequests] =
      await friendServices.getFriendRequestLists(userId);

    return res.status(200).json({ sentRequests, receivedRequests });
  } catch (err) {
    console.log("Error occurred while fetching friend request lists.", err);
    next(err);
  }
};
