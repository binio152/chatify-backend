import z from "zod";

const CreateUserSchema = z.object({
  username: z
    .string()
    .trim()
    .lowercase()
    .min(1, "Username is required")
    .max(50, "Username is too long"),
  email: z
    .string()
    .trim()
    .lowercase()
    .min(1, "Email is required")
    .max(50, "Email is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(50, "Password is too long"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long"),
  avatarUrl: z.string().optional(),
  avatarId: z.string().optional(),
  bio: z.string().max(200, "Bio is too long").optional(),
  phone: z.string().max(20, "Phone is too long").optional(),
});

export type CreateUserType = z.infer<typeof CreateUserSchema>;
