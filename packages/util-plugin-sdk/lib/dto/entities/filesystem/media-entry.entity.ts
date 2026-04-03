import { Entity, Index, Property } from "@mikro-orm/decorators/legacy";
import { IsOptional, IsUrl } from "class-validator";
import path from "node:path";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

import type { Opt } from "@mikro-orm/core";

@Entity({
  discriminatorValue: "media",
})
export class MediaEntry extends FileSystemEntry {
  override type: Opt<"media"> = "media" as const;

  @Index()
  @Property()
  originalFilename!: string;

  // ------------------------
  // Debrid service fields
  // TODO: separate entity?
  // ------------------------

  @Property()
  @IsUrl()
  @IsOptional()
  downloadUrl?: string;

  @Property()
  @IsUrl()
  @IsOptional()
  streamUrl?: string;

  @Property()
  plugin!: string;

  @Property()
  provider!: string | null;

  @Property()
  providerDownloadId?: string;

  // ------------------------

  @Property({ type: "json" })
  libraryProfiles?: string[];

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
