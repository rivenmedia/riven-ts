import z from "zod";

export const TmdbSettings = z.object({
  apiKey: z.string().min(1, "API Key is required"),
});

export type TmdbSettings = z.infer<typeof TmdbSettings>;
