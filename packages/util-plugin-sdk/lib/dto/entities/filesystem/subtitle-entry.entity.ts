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

  @Field(() => String)
  @Property({ type: "text" })
  content!: string;

  @Field(() => String)
  @Property()
  fileHash!: string;

  @Field(() => Int)
  @Property()
  sourceProvider!: string;

  @Field(() => String, { nullable: true })
  @Property()
  sourceId?: string | null;

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
