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
  valuesConfig: {
    continuing: {
      description: "The show is currently airing new episodes.",
    },
    upcoming: {
      description: "The show has been announced but has not yet aired.",
    },
    ended: {
      description: "The show has finished airing all episodes.",
    },
    unknown: {
      description: "The status of the show is unknown.",
    },
  },
});
