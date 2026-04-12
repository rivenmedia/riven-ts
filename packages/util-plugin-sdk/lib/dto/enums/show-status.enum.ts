import { registerEnumType } from "type-graphql";

import type { ValueOf } from "type-fest";

export const ShowStatus = {
  CONTINUING: "continuing",
  UPCOMING: "upcoming",
  ENDED: "ended",
  UNKNOWN: "unknown",
} as const;

export type ShowStatus = ValueOf<typeof ShowStatus>;

registerEnumType(ShowStatus, {
  name: "ShowStatus",
  description: "The current status of a TV show.",
  valuesConfig: {
    CONTINUING: {
      description: "The show is currently airing new episodes.",
    },
    UPCOMING: {
      description: "The show has been announced but has not yet aired.",
    },
    ENDED: {
      description: "The show has finished airing all episodes.",
    },
    UNKNOWN: {
      description: "The status of the show is unknown.",
    },
  },
});
