import { type } from "arktype";
import { registerEnumType } from "type-graphql";

export const MediaItemState = type.enumerated(
  "unknown",
  "unreleased",
  "ongoing",
  "indexed",
  "scraped",
  "downloaded",
  "completed",
  "partially_completed",
  "failed",
  "paused",
);
export type MediaItemState = typeof MediaItemState.infer;

registerEnumType(MediaItemState, {
  name: "MediaItemState",
  description: "The state of a media item in the processing pipeline",
});
