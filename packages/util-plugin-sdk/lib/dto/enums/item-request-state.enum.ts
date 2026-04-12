import { registerEnumType } from "type-graphql";

import type { ValueOf } from "type-fest";

export const ItemRequestState = {
  REQUESTED: "requested",
  COMPLETED: "completed",
  FAILED: "failed",
  ONGOING: "ongoing",
  UNRELEASED: "unreleased",
} as const;

export type ItemRequestState = ValueOf<typeof ItemRequestState>;

registerEnumType(ItemRequestState, {
  name: "ItemRequestState",
  description: "The state of an item request.",
});
