import { Duration } from "@repo/util-plugin-sdk/helpers/dates";
import { json } from "@repo/util-plugin-sdk/validation";

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
  updateIntervalSeconds: json(z.int().nonnegative().nullable())
    .nullable()
    .default(Duration.fromObject({ minutes: 1 }).as("seconds"))
    .describe(
      "Interval in seconds to update content. If using the webhook, set to `null` to disable automatic updates (an initial request will still be made on startup)",
    ),
  autofixMetadataProviders: z
    .stringbool()
    .default(false)
    .describe(
      "Automatically fix metadata provider settings in Seerr if they are incorrect",
    ),
  autofixWebhookBody: z
    .stringbool()
    .default(false)
    .describe(
      "Automatically fix webhook payload body and enable required notification types in Seerr if they are incorrect (required for request approval events to work)",
    ),
});

export type SeerrSettings = z.infer<typeof SeerrSettings>;
