import z from "zod";

export const RealDebridSettings = z.object({
  apiKey: z.string().min(1, "Real Debrid API Key is required"),
});

export type RealDebridSettings = z.infer<typeof RealDebridSettings>;
