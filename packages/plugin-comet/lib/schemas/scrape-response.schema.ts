import { z } from "@rivenmedia/plugin-sdk/validation";

const FirstSearchResult = z.object({
  name: z.literal("[🔄] Comet"),
  url: z.url(),
});

const RegularSearchResult = z.object({
  name: z.string(),
  description: z.string(),
  infoHash: z.hash("sha1"),
  behaviorHints: z.object({
    filename: z.string().optional(),
  }),
});

export const CometScrapeResponse = z.object({
  streams: z.array(z.union([FirstSearchResult, RegularSearchResult])),
});

export type CometScrapeResponse = z.infer<typeof CometScrapeResponse>;
