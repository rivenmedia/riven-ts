import { z } from "zod";

export const PasswordChangeFormSchema = z
  .object({
    currentPassword: z.string().trim().min(1, "Current password is required"),
    newPassword: z
      .string()
      .trim()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z
      .string()
      .trim()
      .min(1, "Confirm new password is required"),
    revokeSessions: z.boolean().optional(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

export type PasswordChangeFormValues = z.infer<typeof PasswordChangeFormSchema>;
