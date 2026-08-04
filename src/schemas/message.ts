import z from "zod";

export const sendDirectMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  conversationId: z.string().optional(),
  content: z.string().min(1).optional(),
});

export type SendDirectMessageType = z.infer<typeof sendDirectMessageSchema>;
