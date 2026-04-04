import { type } from "arktype";
import { registerEnumType } from "type-graphql";

export const MediaItemType = type.enumerated(
  "movie",
  "show",
  "season",
  "episode",
);

export type MediaItemType = typeof MediaItemType.infer;

registerEnumType(MediaItemType, {
  name: "MediaItemType",
  description: "The type of a media item",
});
