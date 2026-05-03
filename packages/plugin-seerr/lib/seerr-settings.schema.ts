import { createPluginSettings } from "@rivenmedia/plugin-sdk/utilities/create-plugin-settings-schema";
import { z } from "@rivenmedia/plugin-sdk/validation";

import { getRequestQueryParamsFilterEnum } from "./__generated__/types/GetRequest.ts";

export const SeerrSettings = createPluginSettings({
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
