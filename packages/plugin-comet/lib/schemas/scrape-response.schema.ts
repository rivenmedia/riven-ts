import { type } from "arktype";

export const CometScrapeResponse = type({
  streams: type({
    description: "string",
    infoHash: "string.hex == 40",
    behaviorHints: type({
      "filename?": "string",
    }),
  }).array(),
});

export type CometScrapeResponse = typeof CometScrapeResponse.infer;
