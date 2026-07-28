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
