import { Schema, model } from "mongoose";

const friendSchema = new Schema(
  {
    userA: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userB: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

friendSchema.pre("validate", function () {
  if (!this.userA || !this.userB) return;

  if (this.userA.equals(this.userB)) {
    this.invalidate("userB", "A user cannot be friends with themselves");
  }
});

friendSchema.pre("save", function () {
  const a = this.userA.toString();
  const b = this.userB.toString();

  if (a > b) [this.userA, this.userB] = [this.userB, this.userA];
});

friendSchema.index({ userA: 1, userB: 1 }, { unique: true });
friendSchema.index({ userA: 1 });
friendSchema.index({ userB: 1 });

export const Friend = model("Friend", friendSchema);
