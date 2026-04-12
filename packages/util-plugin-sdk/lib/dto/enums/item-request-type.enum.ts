import { registerEnumType } from "type-graphql";

import type { ValueOf } from "type-fest";

export const ItemRequestType = {
  MOVIE: "movie",
  SHOW: "show",
} as const;

export type ItemRequestType = ValueOf<typeof ItemRequestType>;

registerEnumType(ItemRequestType, {
  name: "ItemRequestType",
  description: "The type of a media item request.",
});
