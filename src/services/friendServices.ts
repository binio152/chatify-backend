import mongoose from "mongoose";
import { Friend } from "../models/Friend.ts";
import { FriendRequest } from "../models/FriendRequest.ts";
import { messageServices } from "./messageServices.ts";
import { conversationServices } from "./conversationServices.ts";

export const friendServices = {
  acceptFriendRequestAndCreateFriendship: async (
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

      // Ensure a direct conversation exists between the two users. If not, create one
      // and set a friendly preview message.
      const existingConversation = await messageServices.findDirectConversation(
        from,
        to,
      );

      if (!existingConversation) {
        await conversationServices.createDirectConversation(
          session,
          from,
          to,
          "Chat ngay để lan tỏa Hepi!",
        );
      }

      await session.commitTransaction();
      return [friend, friendRequest];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  pairUsers: (userA: string, userB: string): [string, string] =>
    userA.toString() < userB.toString() ? [userA, userB] : [userB, userA],

  checkFriendshipStatus: async (userIdA: string, userIdB: string) => {
    const [userA, userB] = friendServices.pairUsers(userIdA, userIdB);
    console.log({ userA, userB });
    const isFriend = await Friend.findOne({ userA, userB }).lean();
    return isFriend ? true : false;
  },

  getFriendList: async (userId: string) => {
    // Find all friendships where the user is either userA or userB
    const friendships = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate("userA", "_id username email firstName lastName avatarUrl")
      .populate("userB", "_id username email firstName lastName avatarUrl")
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
        .populate("to", "_id username email firstName lastName avatarUrl")
        .lean(),
      FriendRequest.find({ to: userId })
        .populate("from", "_id username email firstName lastName avatarUrl")
        .lean(),
    ]);

    return [sentRequests, receivedRequests];
  },
};
