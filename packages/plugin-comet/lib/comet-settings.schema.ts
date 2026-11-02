import z from "zod";

export const CometSettings = z
  .object({
    url: z
      .url()
      .default("https://comet.feels.legal")
      .describe("The URL of the Comet instance to connect to."),
  })
  .meta({ title: "Comet" });

export type CometSettings = z.infer<typeof CometSettings>;
