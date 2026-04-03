import { Entity, Index, Property } from "@mikro-orm/decorators/legacy";
import { Field, Int, ObjectType } from "type-graphql";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

import type { Opt } from "@mikro-orm/core";

@ObjectType()
@Entity({
  discriminatorValue: "subtitle",
})
export class SubtitleEntry extends FileSystemEntry {
  override type: Opt<"subtitle"> = "subtitle" as const;

  @Field(() => String)
  @Index()
  @Property()
  language!: string;

  @Field(() => String, { nullable: true })
  @Property()
  parentOriginalFilename?: string;

  @Field(() => String)
  @Property()
  content!: string;

  @Field(() => String)
  @Property()
  fileHash!: string;

  @Field(() => Int)
  @Property()
  videoFileSize!: number;

  @Field(() => String, { nullable: true })
  @Property()
  openSubtitlesId?: string; // TODO: Separate entity for external providers?

  getVfsFileName(): string {
    throw new Error("SubtitleEntry vfsFileName not implemented yet");
  }
}
