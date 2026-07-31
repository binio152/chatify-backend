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

messageSchema.pre("validate", function () {
  const hasContent = !!this.content?.trim();
  const hasImage = !!this.imageUrl?.trim();

  if (!hasContent && !hasImage) {
    this.invalidate(
      "content",
      "Message must contain either text content or an image URL",
    );
  }
});

export const Message = model("Message", messageSchema);
