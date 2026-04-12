import { registerEnumType } from "type-graphql";

import type { ValueOf } from "type-fest";

export const MediaItemType = {
  MOVIE: "movie",
  SHOW: "show",
  SEASON: "season",
  EPISODE: "episode",
} as const;

export type MediaItemType = ValueOf<typeof MediaItemType>;

registerEnumType(MediaItemType, {
  name: "MediaItemType",
  description: "The type of a media item",
});
