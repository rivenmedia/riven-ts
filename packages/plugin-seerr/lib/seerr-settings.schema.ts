import z from "zod";

import { getRequestQueryParamsFilterEnum } from "./__generated__/types/GetRequest.ts";

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
  useWebhook: z
    .stringbool()
    .default(false)
    .describe(
      "If true, Seerr will rely on the webhook for requesting items. All items will still be requested on first load.",
    ),
});

export type SeerrSettings = z.infer<typeof SeerrSettings>;
