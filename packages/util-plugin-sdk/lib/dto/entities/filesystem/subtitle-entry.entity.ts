import { Entity, Index, type Opt, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

@ObjectType()
@Entity({
  discriminatorValue: "subtitle",
})
export class SubtitleEntry extends FileSystemEntry {
  override type: Opt<"subtitle"> = "subtitle" as const;

  @Field()
  @Index()
  @Property()
  language!: string;

  @Field()
  @Property({ type: "text" })
  content!: string;

  @Field()
  @Property()
  fileHash!: string;

  @Field()
  @Property()
  sourceProvider!: string;

  @Field({ nullable: true })
  @Property({ nullable: true })
  sourceId?: string;

  @Property({ persist: false, hidden: true })
  get vfsFileName(): Opt<string> {
    const { prettyName } = this.mediaItem.getEntity();

    if (!prettyName) {
      throw new TypeError(
        "Unable to determine VFS file name without associated MediaItem",
      );
    }

    return `${prettyName}.${this.language}.srt`;
  }
}
