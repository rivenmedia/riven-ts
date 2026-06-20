import z from "zod";

export const MeteorSettings = z.object({
  url: z
    .url()
    .default("https://meteorfortheweebs.midnightignite.me")
    .describe("The URL of the Meteor instance to connect to."),
});

export type MeteorSettings = z.infer<typeof MeteorSettings>;
