import { registerEnumType } from "type-graphql";
import z from "zod";

export const ItemRequestType = z.enum(["movie", "show"]);

export type ItemRequestType = z.infer<typeof ItemRequestType>;

registerEnumType(ItemRequestType.enum, {
  name: "ItemRequestType",
  description: "The type of a media item request, either 'movie' or 'show'.",
});
