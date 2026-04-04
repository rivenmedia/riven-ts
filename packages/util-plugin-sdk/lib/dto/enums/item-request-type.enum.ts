import { type } from "arktype";
import { registerEnumType } from "type-graphql";

export const ItemRequestType = type.enumerated("movie", "show");

export type ItemRequestType = typeof ItemRequestType.infer;

registerEnumType(ItemRequestType, {
  name: "ItemRequestType",
  description: "The type of a media item request, either 'movie' or 'show'.",
});
