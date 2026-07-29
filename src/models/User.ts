import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    avatarId: { type: String },
    bio: { type: String, maxLength: 500 },
    phone: { type: String, sparse: true },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
