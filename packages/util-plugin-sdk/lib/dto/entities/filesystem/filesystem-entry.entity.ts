import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { IsPositive } from "class-validator";
import { Field, ID, ObjectType } from "type-graphql";
import z from "zod";

import { MediaItem } from "../media-items/media-item.entity.ts";

export const FileSystemEntryType = z.enum(["media", "subtitle"]);

export type FileSystemEntryType = z.infer<typeof FileSystemEntryType>;

@ObjectType()
@Entity({
  abstract: true,
  discriminatorColumn: "type",
  discriminatorMap: {
    media: "MediaEntry",
    subtitle: "SubtitleEntry",
  },
})
export abstract class FileSystemEntry {
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

  @Field(() => String)
  @Enum(() => FileSystemEntryType.enum)
  type!: FileSystemEntryType;
}
