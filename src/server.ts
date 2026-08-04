import express from "express";
import morgan from "morgan";
import env, { isTest } from "./configs/env.ts";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.ts";
import { notFoundHandler } from "./middlewares/notFoundHandler.ts";
import authRoutes from "./routes/authRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";
import friendRoutes from "./routes/friendRoutes.ts";
import messageRouter from "./routes/messageRoutes.ts";
import conversationRouter from "./routes/conversationRoutes.ts";
import { authenticationToken } from "./middlewares/auth.ts";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(morgan("dev", { skip: () => isTest() })); // skip logging while testing
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running ..." });
});

// Public routes
app.use("/api/auth", authRoutes);

// Authentication middleware for private routes
app.use(authenticationToken);

// Private routes
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRouter);
app.use("/api/conversations", conversationRouter);

// Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
export default app;
