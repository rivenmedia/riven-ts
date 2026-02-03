import { Entity, Index, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

@ObjectType()
@Entity({
  discriminatorValue: "subtitle",
})
export class SubtitleEntry extends FileSystemEntry {
  constructor() {
    super();

    this.type = "subtitle";
  }

  @Field()
  @Index()
  @Property()
  language!: string;

  @Field({ nullable: true })
  @Property()
  parentOriginalFilename?: string;

  @Field()
  @Property()
  content!: string;

  @Field()
  @Property()
  fileHash!: string;

  @Field()
  @Property()
  videoFileSize!: number;

  @Field({ nullable: true })
  @Property()
  openSubtitlesId?: string; // TODO: Separate entity for external providers?

  @Property({ persist: false, hidden: true })
  get vfsFileName(): string {
    throw new Error("SubtitleEntry vfsFileName not implemented yet");
  }

  override type = "subtitle" as const;
}
