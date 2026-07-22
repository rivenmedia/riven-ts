import { Entity, Index, Property, Unique } from "@mikro-orm/decorators/legacy";
import { Field, Int, ObjectType } from "type-graphql";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

import type { Opt } from "@mikro-orm/core";

@ObjectType()
@Entity({
  discriminatorValue: "subtitle",
})
@Unique({ properties: ["mediaItem", "language"] })
export class SubtitleEntry extends FileSystemEntry {
  public override type: Opt<"subtitle"> = "subtitle" as const;

  @Field(() => String)
  @Index()
  @Property()
  public language!: string;

  @Field(() => String)
  @Property()
  public content!: string;

  @Field(() => String)
  @Property()
  public fileHash!: string;

  @Field(() => Int)
  @Property()
  public sourceProvider!: string;

  @Field(() => String, { nullable: true })
  @Property()
  public sourceId?: string | null;

  @Property({ persist: false, hidden: true })
  public async getVfsFileName(): Promise<string> {
    const prettyName = await this.mediaItem.getEntity().getPrettyName();

    if (!prettyName) {
      throw new TypeError(
        "Unable to determine VFS file name without associated MediaItem",
      );
    }

    return `${prettyName}.${this.language}.srt`;
  }
}
