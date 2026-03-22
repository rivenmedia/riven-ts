import z from "zod";

const FirstSearchItem = z.object({
  name: z.literal("[🔄] Comet"),
  url: z.url(),
});

export const CometScrapeResponse = z.object({
  streams: z.preprocess(
    (items) => {
      if (Array.isArray(items) && FirstSearchItem.safeParse(items[0]).success) {
        return items.slice(1) as unknown[];
      }

      return items;
    },
    z.array(
      z.object({
        description: z.string(),
        infoHash: z.hash("sha1"),
        behaviorHints: z.object({
          filename: z.string().optional(),
        }),
      }),
    ),
  ),
});

export type CometScrapeResponse = z.infer<typeof CometScrapeResponse>;
