import { registerEnumType } from "type-graphql";
import z from "zod";

export const ShowStatus = z.enum([
  "continuing",
  "upcoming",
  "ended",
  "unknown",
]);

export type ShowStatus = z.infer<typeof ShowStatus>;

registerEnumType(ShowStatus.enum, {
  name: "ShowStatus",
  description:
    "The current status of a TV show, either 'continuing', 'upcoming', 'ended', or 'unknown'.",
});
