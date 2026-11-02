import { Duration } from "@repo/util-plugin-sdk/helpers/dates";

import z from "zod";

export const ListrrSettings = z
  .object({
    apiKey: z
      .string()
      .min(1, "Listrr API Key is required")
      .describe("Your Listrr API Key")
      .meta({ secret: true }),
    movieLists: z
      .array(z.string().min(1))
      .default([])
      .describe("List of Listrr movie lists to request"),
    showLists: z
      .array(z.string().min(1))
      .default([])
      .describe("List of Listrr show lists to request"),
    updateIntervalSeconds: z
      .int()
      .nonnegative()
      .default(Duration.fromObject({ days: 1 }).as("seconds"))
      .describe("Interval in seconds to update content"),
  })
  .meta({ title: "Listrr" });

export type ListrrSettings = z.infer<typeof ListrrSettings>;
