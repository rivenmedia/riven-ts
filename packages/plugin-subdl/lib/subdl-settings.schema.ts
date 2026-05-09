import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

export const SubdlSettings = z.object({
  apiKey: z
    .string()
    .min(1, "Subdl API Key is required")
    .describe("Your Subdl API Key"),
  languages: json(z.array(z.string().min(1)))
    .describe("List of languages to download")
    .default(["en"]),
});

export type SubdlSettings = z.infer<typeof SubdlSettings>;
