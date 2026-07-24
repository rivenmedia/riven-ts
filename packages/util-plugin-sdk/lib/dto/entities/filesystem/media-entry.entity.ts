import { EntityRepositoryType } from "@mikro-orm/core";
import { Entity, Index, Property } from "@mikro-orm/decorators/legacy";
import { IsOptional, IsUrl } from "class-validator";
import path from "node:path";
import { Field, ObjectType } from "type-graphql";

import { MediaEntryRepository } from "../../repositories/media-entry.repository.ts";
import { FileSystemEntry } from "./filesystem-entry.entity.ts";

import type { Opt } from "@mikro-orm/core";

@ObjectType()
@Entity({
  discriminatorValue: "media",
  repository: () => MediaEntryRepository,
})
export class MediaEntry extends FileSystemEntry {
  public [EntityRepositoryType]?: MediaEntryRepository;

  public override type: Opt<"media"> = "media" as const;

  @Field(() => String)
  @Index()
  @Property()
  public originalFilename!: string;

  // ------------------------
  // Debrid service fields
  // TODO: separate entity?
  // ------------------------

  @Field(() => String, { nullable: true })
  @Property()
  @IsUrl()
  @IsOptional()
  public downloadUrl?: string;

  @Field(() => String, { nullable: true })
  @Property()
  @IsUrl()
  @IsOptional()
  public streamPermalink?: string;

  @Field(() => String)
  @Property()
  public plugin!: string;

  @Field(() => String, { nullable: true })
  @Property()
  public provider!: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  public providerDownloadId?: string;

  // ------------------------

  @Field(() => [String], { nullable: true })
  @Property({ type: "json" })
  public libraryProfiles?: string[];

  @Field(() => Object, { nullable: true })
  @Property({ type: "json" })
  public mediaMetadata?: object;

  public async getVfsFileName(): Promise<string> {
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
