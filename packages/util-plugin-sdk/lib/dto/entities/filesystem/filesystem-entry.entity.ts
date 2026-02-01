import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { IsPositive } from "class-validator";
import { Field, ID, ObjectType } from "type-graphql";

import { MediaItem } from "../media-items/media-item.entity.ts";

@ObjectType()
@Entity({
  discriminatorColumn: "type",
})
export class FileSystemEntry {
  @Field((_type) => ID)
  @PrimaryKey()
  id!: number;

  @Field(() => Number)
  @Property({ type: "bigint" })
  @IsPositive()
  fileSize!: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property({ onUpdate: () => new Date() })
  updatedAt?: Date;

  @Field(() => MediaItem)
  @ManyToOne()
  mediaItem!: Ref<MediaItem>;
}
