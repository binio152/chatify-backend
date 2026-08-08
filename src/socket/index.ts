import { Server } from "socket.io";
import http from "http";
import express from "express";
import env from "../configs/env.ts";
import { socketAuthentication } from "../middlewares/socket.ts";
import { getConversationsForSocketIO } from "../controllers/conversationController.ts";
import type { Types } from "mongoose";

const app = express();
const allowedOrigins = env.CORS_ORIGIN;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  },
});

const onlineUsers = new Map();

io.use(socketAuthentication);

io.on("connection", async (socket) => {
  const user = socket.user;

  if (!user) return;

  console.log(`Socket connected: ${user.username} <${user.email}>`);

  onlineUsers.set(user._id, socket.id);
  // console.log("Online users: ", onlineUsers); // DEV ONLY
  io.emit("online-users", Array.from(onlineUsers.keys()));

  const conversationIds = await getConversationsForSocketIO(
    user._id.toString(),
  );

  // console.log({ conversationIds }); //DEV ONLY
  conversationIds.forEach((id: { conversationId: Types.ObjectId }) => {
    socket.join(id.conversationId.toString());
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(user!._id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`Socket disconnected: ${user?.username} <${user?.email}>`);
  });
});

export { app, io, server };
