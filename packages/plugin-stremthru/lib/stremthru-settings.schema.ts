import z from "zod";

export const StremThruSettings = z.object({
  realdebridApiKey: z.string(),
});

export type StremThruSettings = z.infer<typeof StremThruSettings>;
