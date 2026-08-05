import type { HydratedDocument, InferSchemaType } from "mongoose";
import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image"],
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model("Message", messageSchema);

export type MessageDocument = HydratedDocument<
  InferSchemaType<typeof messageSchema>
>;
