import z from "zod";

export const createConversationSchema = z.object({
  type: z.enum(["direct", "group"]).default("direct"),
  name: z.string().optional(),
  memberIds: z
    .array(z.string().min(1, "Member ID is required"))
    .min(1, "At least one member is required"),
});

export type CreateConversationType = z.infer<typeof createConversationSchema>;
