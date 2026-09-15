import z from "zod";

export const ItemRequestState = z.enum([
  "requested",
  "completed",
  "failed",
  "ongoing",
  "unreleased",
  "processing",
  "paused",
]);

export type ItemRequestState = z.infer<typeof ItemRequestState>;
