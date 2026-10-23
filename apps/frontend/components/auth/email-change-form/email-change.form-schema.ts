import z from "zod";

export const EmailChangeFormSchema = z.object({
  newEmail: z.email(),
});
