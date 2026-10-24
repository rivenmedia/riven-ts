import { z } from "zod";

export const ChangeEmailFormSchema = z.object({
  newEmail: z.email("Invalid email address"),
});

export type ChangeEmailFormValues = z.infer<typeof ChangeEmailFormSchema>;
