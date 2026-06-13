import z from "zod";

const MeteorStream = z.object({
  name: z.string(),
  description: z.string(),
  infoHash: z.hash("sha1"),
  behaviorHints: z.object({
    filename: z.string().optional(),
  }),
});

export const MeteorScrapeResponse = z.object({
  streams: z.array(MeteorStream),
});

export type MeteorScrapeResponse = z.infer<typeof MeteorScrapeResponse>;
