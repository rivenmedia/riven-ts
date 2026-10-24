import z from "zod";

export const ChangeEmailFormSchema = z.object({
  newEmail: z.email(),
});
