import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

export const MdbListSettings = z.object({
  apiKey: z
    .string()
    .min(1, "MdbList API Key is required")
    .describe("Your MdbList API Key"),
  lists: json(z.array(z.string().min(1)))
    .default([])
    .describe("List of MdbList lists to request"),
});

export type MdbListSettings = z.infer<typeof MdbListSettings>;
