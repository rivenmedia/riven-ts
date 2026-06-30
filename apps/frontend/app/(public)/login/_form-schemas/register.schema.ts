import z from "zod";

const Password = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long");

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(31, "Username must be at most 31 characters long"),
    email: z.email("Invalid email address"),
    image: z.string().optional(),
    password: Password,
    confirmPassword: Password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirmation do not match.",
    path: ["confirmPassword"],
  });
