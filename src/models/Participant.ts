import type { InferSchemaType, HydratedDocument } from "mongoose";
import { Schema, model } from "mongoose";

const participantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "admin", "owner"],
      default: "member",
    },
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    unreadCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

participantSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
participantSchema.index({ userId: 1 });

export const Participant = model("Participant", participantSchema);

export type ParticipantDocument = HydratedDocument<
  InferSchemaType<typeof participantSchema>
>;
