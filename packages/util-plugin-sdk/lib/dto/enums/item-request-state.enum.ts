import z from "zod";

export const ItemRequestState = z.enum([
  "requested",
  "requested_additional_seasons",
  "completed",
  "failed",
  "ongoing",
  "unreleased",
]);

export type ItemRequestState = z.infer<typeof ItemRequestState>;
