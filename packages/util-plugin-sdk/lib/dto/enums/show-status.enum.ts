import z from "zod";

export const ShowStatus = z.enum([
  "continuing",
  "upcoming",
  "ended",
  "unknown",
]);

export type ShowStatus = z.infer<typeof ShowStatus>;
