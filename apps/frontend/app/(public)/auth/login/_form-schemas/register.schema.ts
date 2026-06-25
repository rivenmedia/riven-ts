import z from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(31, "Username must be at most 31 characters long"),
    email: z.email("Invalid email address"),
    image: z.string().optional(),
    password: z.string().min(4, "Password must be at least 4 characters long"),
    confirmPassword: z
      .string()
      .min(4, "Confirm Password must be at least 4 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirmation do not match.",
    path: ["confirmPassword"],
  });
