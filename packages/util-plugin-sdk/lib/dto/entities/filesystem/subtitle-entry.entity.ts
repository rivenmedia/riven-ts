import { Entity, Index, Property } from "@mikro-orm/decorators/legacy";
import { Field, ObjectType } from "type-graphql";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

import type { Opt } from "@mikro-orm/core";

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
  async getVfsFileName(): Promise<string> {
    const prettyName = await this.mediaItem.getEntity().getPrettyName();

    if (!prettyName) {
      throw new TypeError(
        "Unable to determine VFS file name without associated MediaItem",
      );
    }

    return `${prettyName}.${this.language}.srt`;
  }
}
