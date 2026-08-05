import z from "zod";

export const sendDirectMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  conversationId: z.string().optional(),
  content: z.string().min(1).optional(),
});

export const sendGroupMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z.string().min(1).optional(),
});

export type SendDirectMessageType = z.infer<typeof sendDirectMessageSchema>;
export type SendGroupMessageType = z.infer<typeof sendGroupMessageSchema>;
