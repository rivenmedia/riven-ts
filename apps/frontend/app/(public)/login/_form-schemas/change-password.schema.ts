import { z } from "zod";

export const passwordChangeSchema = z
  .object({
    oldPassword: z.string().min(1, "Your old password cannot be empty"),
    newPassword: z
      .string()
      .min(8, "Your password must have 8 characters or more."),
    confirmNewPassword: z.string(),
    revokeSessions: z.coerce.boolean<boolean>(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmNewPassword"],
  });

export type PasswordChangeSchema = z.infer<typeof passwordChangeSchema>;
