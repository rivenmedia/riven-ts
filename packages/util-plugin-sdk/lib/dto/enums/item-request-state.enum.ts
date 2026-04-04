import { type } from "arktype";
import { registerEnumType } from "type-graphql";

export const ItemRequestState = type.enumerated(
  "requested",
  "completed",
  "failed",
  "ongoing",
  "unreleased",
);

export type ItemRequestState = typeof ItemRequestState.infer;

registerEnumType(ItemRequestState, {
  name: "ItemRequestState",
  description:
    "The state of an item request, either 'requested', 'completed', 'failed', 'ongoing', or 'unreleased'.",
});
