import type { HydratedDocument } from "mongoose";
import { Schema, model, type InferRawDocType } from "mongoose";

const friendRequestSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, trim: true, maxLength: 200 },
  },
  { timestamps: true },
);

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
friendRequestSchema.index({ from: 1 });
friendRequestSchema.index({ to: 1 });

friendRequestSchema.pre("validate", function () {
  if (!this.from || !this.to) return;

  if (this.from.equals(this.to)) {
    this.invalidate("to", "You cannot send a friend request to yourself");
  }
});

export const FriendRequest = model("FriendRequest", friendRequestSchema);
