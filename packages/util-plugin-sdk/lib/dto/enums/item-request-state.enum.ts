import { registerEnumType } from "type-graphql";
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

registerEnumType(ItemRequestState.enum, {
  name: "ItemRequestState",
  description:
    "The state of an item request, either 'requested', 'completed', 'failed', 'ongoing', or 'unreleased'.",
});
