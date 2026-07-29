import mongoose from "mongoose";
import env from "./env.ts";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.DATABASE_URL);
    console.log("DB connect successfully");
  } catch (err) {
    console.log("Error occurred while connecting DB", err);
    process.exit(1);
  }
};
