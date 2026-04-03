import z from "zod";

export const ItemRequestState = z.enum([
  "requested",
  "completed",
  "failed",
  "ongoing",
  "unreleased",
]);

export type ItemRequestState = z.infer<typeof ItemRequestState>;
