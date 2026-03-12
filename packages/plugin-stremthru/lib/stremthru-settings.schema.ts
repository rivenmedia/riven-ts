import z from "zod";

export const StremThruSettings = z.object({
  stremThruUrl: z
    .url()
    .default("https://stremthru.13377001.xyz/")
    .describe("The URL of the StremThru instance to request"),
  realdebridApiKey: z.string(),
});

export type StremThruSettings = z.infer<typeof StremThruSettings>;
