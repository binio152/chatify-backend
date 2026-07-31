import { Schema, model } from "mongoose";

const friendSchema = new Schema(
  {
    userA: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userB: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

friendSchema.pre("validate", function () {
  const a = this.userA.toString();
  const b = this.userB.toString();

  if (a > b) [this.userA, this.userB] = [this.userB, this.userA];

  if (this.userA.equals(this.userB)) {
    this.invalidate("userB", "Users cannot be friends with themselves");
  }
});

friendSchema.index({ userA: 1, userB: 1 }, { unique: true });
friendSchema.index({ userA: 1 });
friendSchema.index({ userB: 1 });

export const Friend = model("Friend", friendSchema);
