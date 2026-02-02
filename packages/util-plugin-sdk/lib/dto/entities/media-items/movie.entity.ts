import { Entity } from "@mikro-orm/core";
import { ObjectType } from "type-graphql";

import { MediaItem } from "./media-item.entity.ts";

@ObjectType()
@Entity()
export class Movie extends MediaItem {
  override type = "movie" as const;
}
