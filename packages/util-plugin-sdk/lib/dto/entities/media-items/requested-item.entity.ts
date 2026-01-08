import { ObjectType } from "type-graphql";
import { ChildEntity } from "typeorm";

import { MediaItem, type MediaItemState } from "./media-item.entity.ts";

@ObjectType()
@ChildEntity()
export class RequestedItem extends MediaItem {
  declare state: Extract<MediaItemState, "Requested">;
}
