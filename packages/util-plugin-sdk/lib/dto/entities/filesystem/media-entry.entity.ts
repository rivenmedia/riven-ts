import { Entity, Index, type Opt, Property } from "@mikro-orm/core";
import { IsOptional, IsUrl } from "class-validator";
import path from "node:path";
import { Field, ObjectType } from "type-graphql";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

@ObjectType()
@Entity({
  discriminatorValue: "media",
})
export class MediaEntry extends FileSystemEntry {
  override type: Opt<"media"> = "media" as const;

  @Field()
  @Index()
  @Property()
  originalFilename!: string;

  // ------------------------
  // Debrid service fields
  // TODO: separate entity?
  // ------------------------

  @Field({ nullable: true })
  @Property()
  @IsUrl()
  @IsOptional()
  downloadUrl?: string;

  @Field({ nullable: true })
  @Property()
  @IsUrl()
  @IsOptional()
  streamUrl?: string;

  @Field()
  @Property()
  plugin!: string;

  @Field(() => String, { nullable: true })
  @Property()
  provider!: string | null;

  @Field({ nullable: true })
  @Property()
  providerDownloadId?: string;

  // ------------------------

  @Field(() => [String], { nullable: true })
  @Property({ type: "json" })
  libraryProfiles?: string[];

  @Field(() => String, { nullable: true })
  @Property({ type: "json" })
  mediaMetadata?: object;

  async getVfsFileName(): Promise<string> {
    const prettyName = await this.mediaItem.getEntity().getPrettyName();

    if (!prettyName) {
      throw new TypeError(
        "Unable to determine VFS file name without associated MediaItem",
      );
    }

    return path.format({
      name: prettyName,
      ext: path.extname(this.originalFilename),
    });
  }
}
