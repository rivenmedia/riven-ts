import z from "zod";

export const PasskeyFormSchema = z.object({
  passkeyName: z
    .string()
    .trim()
    .min(1, { message: "Passkey name is required" }),
});
