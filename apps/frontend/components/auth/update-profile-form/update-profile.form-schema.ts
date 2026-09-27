import z from "zod";

export const UpdateProfileFormSchema = z.object({
  username: z.string().trim().min(1, { message: "Username is required" }),
  name: z.string().trim().min(1, { message: "Name is required" }),
  avatar: z.union([
    z.url({ message: "Avatar must be a valid URL" }),
    z.literal(""),
  ]),
});

export type UpdateProfileFormValues = z.infer<typeof UpdateProfileFormSchema>;
