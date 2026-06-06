import { PrimaryKeyProp } from "@mikro-orm/core";
import { Entity, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { Field, ObjectType } from "type-graphql";

import { MediaItem } from "../media-items/media-item.entity.ts";
import { Stream } from "./stream.entity.ts";

@ObjectType()
@Entity()
export class BlacklistedStream {
  [PrimaryKeyProp]?: ["mediaItem", "stream", "plugin", "provider"];

  @Field(() => Stream)
  @ManyToOne({ primary: true })
  stream!: Stream;

  @Field(() => MediaItem)
  @ManyToOne({ primary: true })
  mediaItem!: MediaItem;

  @Field(() => String, { nullable: true })
  @Property({ primary: true })
  provider?: string;

  @Field(() => String)
  @Property({ primary: true })
  plugin!: string;
}
