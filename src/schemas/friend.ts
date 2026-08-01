import z from "zod";

export const sendFriendRequestSchema = z.object({
  to: z.string().trim().min(1, "Receiver ID is required"),
  message: z.string().trim().max(200, "Message is too long").optional(),
});

export const friendRequestIdSchema = z.object({
  requestId: z.string().min(1, "Friend request ID is required"),
});

export type SendFriendRequestType = z.infer<typeof sendFriendRequestSchema>;
export type FriendRequestIdType = z.infer<typeof friendRequestIdSchema>;
