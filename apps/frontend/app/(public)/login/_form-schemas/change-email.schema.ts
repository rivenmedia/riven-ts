import { z } from "zod";

export const emailChangeSchema = z.object({
  newEmail: z.email("Invalid email address"),
});

export type EmailChangeSchema = z.infer<typeof emailChangeSchema>;
