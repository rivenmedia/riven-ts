import z from "zod";

const FirstSearchResult = z.object({
  name: z.literal("[🔄] Comet"),
  url: z.url(),
});

/**
 * Comet's behaviorHints occasionally carry structured stream metadata
 * (`videoSize` is the conventional Stremio property name). We treat every
 * structured field as best-effort and never fall back to fabricated values.
 */
const BehaviorHints = z.object({
  filename: z.string().optional(),
  videoSize: z.number().int().nonnegative().optional(),
});

const RegularSearchResult = z.object({
  name: z.string(),
  description: z.string(),
  infoHash: z.hash("sha1"),
  behaviorHints: BehaviorHints,
});

export type CometRegularSearchResult = z.infer<typeof RegularSearchResult>;

export const CometScrapeResponse = z.object({
  streams: z.array(z.union([FirstSearchResult, RegularSearchResult])),
});

export type CometScrapeResponse = z.infer<typeof CometScrapeResponse>;
