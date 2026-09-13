import { Duration } from "@repo/util-plugin-sdk/helpers/dates";
import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

export const ListrrSettings = z.object({
  apiKey: z
    .string()
    .min(1, "Listrr API Key is required")
    .describe("Your Listrr API Key"),
  movieLists: json(z.array(z.string().min(1)))
    .default([])
    .describe("List of Listrr movie lists to request"),
  showLists: json(z.array(z.string().min(1)))
    .default([])
    .describe("List of Listrr show lists to request"),
  updateIntervalSeconds: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(Duration.fromObject({ days: 1 }).as("seconds"))
    .describe("Interval in seconds to update content"),
});

export type ListrrSettings = z.infer<typeof ListrrSettings>;
