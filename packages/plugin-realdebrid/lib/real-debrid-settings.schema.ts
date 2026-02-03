import z from "zod";

export const realDebridSettingsSchema = z.object({
  apiKey: z.string().min(1, "Real Debrid API Key is required"),
});
