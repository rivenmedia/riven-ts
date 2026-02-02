import { Entity, Index, Property } from "@mikro-orm/core";
import { IsOptional, IsUrl } from "class-validator";
import path from "node:path";
import { Field, ObjectType } from "type-graphql";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

@ObjectType()
@Entity({
  discriminatorValue: "media",
})
export class MediaEntry extends FileSystemEntry {
  constructor() {
    super();

    this.type = "media";
  }

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
  unrestrictedUrl?: string;

  @Field()
  @Property()
  provider!: string;

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

  @Property({ persist: false })
  get vfsFileName() {
    const vfsIdentifier = this.mediaItem.getProperty("vfsIdentifier");

    if (!vfsIdentifier) {
      throw new TypeError(
        "Unable to determine VFS file name without associated MediaItem",
      );
    }

    const extension = path.extname(this.originalFilename);

    return `${vfsIdentifier}${extension}`;
  }

  @Property({ persist: false })
  get path() {
    const vfsIdentifier = this.mediaItem.getProperty("vfsIdentifier");

    if (!vfsIdentifier) {
      throw new TypeError("MediaEntry has no VFS identifier");
    }

    return path.join(vfsIdentifier, this.vfsFileName);
  }
}
