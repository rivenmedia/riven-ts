import { EntityRepositoryType, type Opt } from "@mikro-orm/core";
import { Entity, Index, Property } from "@mikro-orm/decorators/legacy";
import { IsOptional, IsUrl } from "class-validator";
import path from "node:path";
import { Field, ObjectType } from "type-graphql";

import { MediaEntryRepository } from "../../repositories/media-entry.repository.ts";
import { FileSystemEntry } from "./filesystem-entry.entity.ts";

@ObjectType()
@Entity({
  discriminatorValue: "media",
  repository: () => MediaEntryRepository,
})
export class MediaEntry extends FileSystemEntry {
  [EntityRepositoryType]?: MediaEntryRepository;

  override type: Opt<"media"> = "media" as const;

  @Field(() => String)
  @Index()
  @Property()
  originalFilename!: string;

  // ------------------------
  // Debrid service fields
  // TODO: separate entity?
  // ------------------------

  @Field(() => String, { nullable: true })
  @Property()
  @IsUrl()
  @IsOptional()
  downloadUrl?: string;

  @Field(() => String, { nullable: true })
  @Property()
  @IsUrl()
  @IsOptional()
  streamUrl?: string;

  @Field(() => String)
  @Property()
  plugin!: string;

  @Field(() => String, { nullable: true })
  @Property()
  provider!: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  providerDownloadId?: string;

  // ------------------------

  @Field(() => [String], { nullable: true })
  @Property({ type: "json" })
  libraryProfiles?: string[];

  @Field(() => Object, { nullable: true })
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
