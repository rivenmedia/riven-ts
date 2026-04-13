import { registerEnumType } from "type-graphql";
import z from "zod";

export const MediaItemType = z.enum(["movie", "show", "season", "episode"]);

export type MediaItemType = z.infer<typeof MediaItemType>;

registerEnumType(MediaItemType.enum, {
  name: "MediaItemType",
  description: "The type of a media item",
});
