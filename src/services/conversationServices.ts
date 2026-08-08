import mongoose, { Types } from "mongoose";
import { Conversation } from "../models/Conversation.ts";
import { Participant } from "../models/Participant.ts";
import { UserRole } from "../schemas/conversation.ts";
import { buildDirectConversationKey } from "../utils/directConversation.ts";
import { cloudinaryServices } from "./cloudinaryServices.ts";
import type { UploadApiResponse } from "cloudinary";

export const conversationServices = {
  createDirectConversation: async (
    session: mongoose.ClientSession,
    ownerId: string,
    participantId: string,
    messagePreview?: string,
  ) => {
    const conversationData: any = {
      type: "direct",
      directKey: buildDirectConversationKey(ownerId, participantId),
    };

    if (typeof messagePreview === "string") {
      conversationData.messagePreview = messagePreview;
    }

    const conversation = new Conversation(conversationData);
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
    groupAvatar?: Express.Multer.File,
  ) => {
    let avatarUrl = `https://api.dicebear.com/10.x/landscape/svg?seed=${name}`;

    if (groupAvatar) {
      const result = await cloudinaryServices.uploadGroupAvtar(
        groupAvatar.buffer,
      );
      avatarUrl = (result as UploadApiResponse).url;
    }

    const conversation = new Conversation({
      type: "group",
      messagePreview: `Nhóm ${name} đã được tạo.`,
      group: {
        name,
        createdBy: ownerId,
        avatarUrl,
      },
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
