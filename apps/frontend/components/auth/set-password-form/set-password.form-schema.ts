import { z } from "zod";

export const SetPasswordFormSchema = z
  .object({
    newPassword: z
      .string()
      .trim()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z
      .string()
      .trim()
      .min(1, "Confirm new password is required"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmNewPassword"],
  });

export type SetPasswordFormValues = z.infer<typeof SetPasswordFormSchema>;
