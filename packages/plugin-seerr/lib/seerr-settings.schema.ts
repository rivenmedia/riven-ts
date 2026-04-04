import { type } from "arktype";

import { getRequestQueryParamsFilterEnum } from "./__generated__/index.ts";

export const SeerrSettings = type({
  apiKey: type("string > 0").describe("Your Seerr API Key"),
  url: type("string.url")
    .describe("Your Seerr instance URL (e.g. http://localhost:5055)")
    .default("http://localhost:5055"),
  filter: type
    .valueOf(getRequestQueryParamsFilterEnum)
    .describe(
      "Request status filter (all, approved, available, pending, processing, ...)",
    )
    .default("approved"),
});

export type SeerrSettings = typeof SeerrSettings.infer;
