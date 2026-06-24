import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(15, "Username must be at most 15 characters long"),
  password: z.string().min(4, "Password must be at least 4 characters long"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
