import { registerEnumType } from "type-graphql";
import z from "zod";

export const MediaItemState = z.enum([
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
]);

export type MediaItemState = z.infer<typeof MediaItemState>;

registerEnumType(MediaItemState.enum, {
  name: "MediaItemState",
  description: "The state of a media item in the processing pipeline",
});
