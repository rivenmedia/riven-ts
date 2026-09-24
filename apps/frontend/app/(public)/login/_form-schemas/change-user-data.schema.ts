import { z } from "zod";

export const changeUserDataSchema = z.object({
  newUsername: z
    .union([
      z.literal(""),
      z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(31, "Username must be at most 31 characters long"),
    ])
    .optional()
    .default(""),
  newName: z
    .string()
    .max(100, "Name must be at most 100 characters long")
    .optional()
    .default(""),
  newAvatar: z
    .union([z.url("Avatar must be a valid URL"), z.literal("")])
    .optional()
    .default(""),
});

export type ChangeUserDataSchema = z.infer<typeof changeUserDataSchema>;
