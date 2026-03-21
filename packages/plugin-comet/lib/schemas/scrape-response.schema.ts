import z from "zod";

export const CometScrapeResponse = z.object({
  streams: z.array(
    z.object({
      description: z.string(),
      infoHash: z.hash("sha1"),
      behaviorHints: z.object({
        filename: z.string().optional(),
      }),
    }),
  ),
});

export type CometScrapeResponse = z.infer<typeof CometScrapeResponse>;
