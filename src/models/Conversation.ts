import { Schema, model } from "mongoose";

const groupSchema = new Schema(
  {
    name: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

const lastMessageSchema = new Schema(
  {
    _id: { type: String },
    content: { type: String, default: null },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: null },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
      default: "direct",
    },
    group: { type: groupSchema },
    lassMessage: { type: lastMessageSchema, default: null },
    lastMessageAt: { type: Date },
  },
  { timestamps: true },
);

conversationSchema.index({ lastMessageAt: -1 });

export const Conversation = model("Conversation", conversationSchema);
