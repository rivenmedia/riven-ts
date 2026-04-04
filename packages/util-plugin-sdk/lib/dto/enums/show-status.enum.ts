import { type } from "arktype";
import { registerEnumType } from "type-graphql";

export const ShowStatus = type.enumerated(
  "continuing",
  "upcoming",
  "ended",
  "unknown",
);

export type ShowStatus = typeof ShowStatus.infer;

registerEnumType(ShowStatus, {
  name: "ShowStatus",
  description:
    "The current status of a TV show, either 'continuing', 'upcoming', 'ended', or 'unknown'.",
});
