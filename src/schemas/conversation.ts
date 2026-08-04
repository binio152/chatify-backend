import z from "zod";

export const ConversationType = {
  DIRECT: "direct",
  GROUP: "group",
} as const;

export const UserRole = {
  OWNER: "owner",
  MEMBER: "member",
  ADMIN: "admin",
} as const;

export const createConversationSchema = z.object({
  type: z
    .enum([ConversationType.DIRECT, ConversationType.GROUP])
    .default(ConversationType.DIRECT),
  name: z.string().min(2, "Name must be at least 2 characters long").optional(),
  memberIds: z
    .array(z.string().min(1, "Member ID is required"))
    .min(1, "At least one member is required"),
});

export type CreateConversationType = z.infer<typeof createConversationSchema>;
