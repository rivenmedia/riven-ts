import { PrimaryKeyProp } from "@mikro-orm/core";
import { Entity, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { Field, ObjectType } from "type-graphql";

import { MediaItem } from "../media-items/media-item.entity.ts";
import { Stream } from "./stream.entity.ts";

@ObjectType()
@Entity()
export class BlacklistedStream {
  public [PrimaryKeyProp]?: ["mediaItem", "stream", "plugin", "provider"];

  @Field(() => Stream)
  @ManyToOne({ primary: true })
  public stream!: Stream;

  @Field(() => MediaItem)
  @ManyToOne({ primary: true })
  public mediaItem!: MediaItem;

  @Field(() => String, { nullable: true })
  @Property({ primary: true })
  public provider?: string;

  @Field(() => String)
  @Property({ primary: true })
  public plugin!: string;
}
