import mongoose from "mongoose";
import { Friend } from "../models/Friend.ts";
import { FriendRequest } from "../models/FriendRequest.ts";
import { userSelectFields } from "../constants/index.ts";

export const friendServices = {
  acceptFriendRequest: async (
    from: string,
    to: string,
    reverseRequestId: string,
  ) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Create a new friend relationship
      const [friend] = await Friend.create([{ userA: from, userB: to }], {
        session,
      });

      // Delete the reverse friend request
      const friendRequest = await FriendRequest.findByIdAndDelete(
        { _id: reverseRequestId },
        { session },
      );

      await session.commitTransaction();
      return [friend, friendRequest];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  checkFriendshipStatus: async (userIdA: string, userIdB: string) => {
    const isFriend = await Friend.findOne({
      $or: [
        { userA: userIdA, userB: userIdB },
        { userA: userIdB, userB: userIdA },
      ],
    });
    return isFriend ? true : false;
  },

  getFriendList: async (userId: string) => {
    // Find all friendships where the user is either userA or userB
    const friendships = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate("userA", userSelectFields)
      .populate("userB", userSelectFields)
      .lean();

    // If no friendships are found, return an empty array
    if (!friendships || friendships.length === 0) return [];

    // Map the friendships to get the friend user objects
    const friendLists = friendships.map((relation) =>
      relation.userA._id.toString() === userId.toString()
        ? relation.userB
        : relation.userA,
    );

    return friendLists;
  },

  getFriendRequestLists: async (userId: string) => {
    const [sentRequests, receivedRequests] = await Promise.all([
      FriendRequest.find({ from: userId })
        .populate("to", userSelectFields)
        .lean(),
      FriendRequest.find({ to: userId })
        .populate("from", userSelectFields)
        .lean(),
    ]);

    return [sentRequests, receivedRequests];
  },
};
