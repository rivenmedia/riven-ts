import { ObjectType } from "type-graphql";
import { ChildEntity } from "typeorm";

import { MediaItem } from "./media-item.entity.ts";

@ObjectType()
@ChildEntity()
export class Movie extends MediaItem {}
