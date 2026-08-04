import mongoose, { Types } from "mongoose";
import { Conversation } from "../models/Conversation.ts";
import {
  Participant,
  type ParticipantDocument,
} from "../models/Participant.ts";
import { UserRole } from "../schemas/conversation.ts";

export const conversationServices = {
  createDirectConversation: async (
    session: mongoose.ClientSession,
    ownerId: string,
    participantId: string,
  ) => {
    const conversation = new Conversation({ type: "direct" });
    await conversation.save({ session });

    const participants = await Participant.create(
      [
        {
          conversationId: conversation._id,
          role: UserRole.OWNER,
          userId: ownerId,
        },
        {
          conversationId: conversation._id,
          role: UserRole.MEMBER,
          userId: participantId,
        },
      ],
      { session, ordered: true },
    );

    return { conversation, participants };
  },

  createGroupConversation: async (
    session: mongoose.ClientSession,
    name: string,
    ownerId: string,
    memberIds: string[],
  ) => {
    const conversation = new Conversation({
      type: "group",
      group: { name, createdBy: ownerId },
    });

    await conversation.save({ session });

    const memberData = memberIds.map((memberId) => ({
      conversationId: conversation._id,
      role: UserRole.MEMBER,
      userId: memberId,
    }));

    const participants = await Participant.create(
      [
        {
          conversationId: conversation._id,
          role: UserRole.OWNER,
          userId: ownerId,
        },
        ...memberData,
      ],
      { session, ordered: true },
    );

    return { conversation, participants };
  },
};

export default conversationServices;
