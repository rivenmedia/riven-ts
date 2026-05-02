import { z } from "@rivenmedia/plugin-sdk/validation";

export const CometSettings = z.object({
  url: z
    .url()
    .default("https://comet.feels.legal")
    .describe("The URL of the Comet instance to connect to."),
});

export type CometSettings = z.infer<typeof CometSettings>;
