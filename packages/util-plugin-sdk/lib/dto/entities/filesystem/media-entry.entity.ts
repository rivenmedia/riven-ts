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
  get path() {
    const basePath = this.mediaItem.getProperty("path");

    if (!basePath) {
      throw new TypeError("MediaEntry is missing associated MediaItem");
    }

    const baseDirectory = this.mediaItem.getProperty("baseDirectory");

    if (!baseDirectory) {
      throw new TypeError("MediaEntry has no base directory");
    }

    const extension = path.extname(this.originalFilename);

    return `${baseDirectory}/${basePath}/${basePath}${extension}`;
  }
}
