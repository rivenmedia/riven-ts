import { z } from "zod";

export const setPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Your password must have 8 characters or more."),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmNewPassword"],
  });

export type SetPasswordSchema = z.infer<typeof setPasswordSchema>;
