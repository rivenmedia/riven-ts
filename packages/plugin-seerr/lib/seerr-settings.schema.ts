import z from "zod";

import { getRequestQueryParamsFilterEnum } from "./__generated__/index.ts";

export const SeerrSettings = z.object({
  apiKey: z
    .string()
    .min(1, "Seerr API Key is required")
    .describe("Your Seerr API Key"),
  url: z
    .url("Seerr URL must be a valid URL")
    .default("http://localhost:5055")
    .describe("Your Seerr instance URL (e.g. http://localhost:5055)"),
  filter: z
    .enum(getRequestQueryParamsFilterEnum)
    .default("approved")
    .describe(
      "Request status filter (all, approved, available, pending, processing, ...)",
    ),
});

export type SeerrSettings = z.infer<typeof SeerrSettings>;
