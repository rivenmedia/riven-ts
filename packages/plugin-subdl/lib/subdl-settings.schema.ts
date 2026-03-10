import z from "zod";

export const SubdlSettings = z.object({
  apiKey: z.string(),
  languages: z.array(z.string()).default(["en"]),
});

export type SubdlSettings = z.infer<typeof SubdlSettings>;
