import { userRoleSchema } from "$lib/permissions";
import { z } from "zod";

export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(31, "Username must be at most 31 characters long"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must have 8 characters or more."),
    confirmPassword: z.string(),
    role: userRoleSchema.default("user"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirmation do not match.",
    path: ["confirmPassword"],
  });

export type CreateUserSchema = z.infer<typeof createUserSchema>;
