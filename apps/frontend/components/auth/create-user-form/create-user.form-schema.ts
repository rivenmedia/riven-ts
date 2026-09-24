import { UserRole } from "@repo/util-auth/access-control";

import z from "zod";

export const CreateUserFormSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required"),
    email: z.email("Invalid email address"),
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().trim(),
    role: UserRole,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });
