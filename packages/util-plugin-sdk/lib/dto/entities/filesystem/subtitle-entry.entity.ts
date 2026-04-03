import { Entity, Index, Property } from "@mikro-orm/decorators/es";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

import type { Opt } from "@mikro-orm/core";

@Entity({
  discriminatorValue: "subtitle",
})
export class SubtitleEntry extends FileSystemEntry {
  override type: Opt<"subtitle"> = "subtitle" as const;

  @Index()
  @Property()
  language!: string;

  @Property()
  parentOriginalFilename?: string;

  @Property()
  content!: string;

  @Property()
  fileHash!: string;

  @Property()
  videoFileSize!: number;

  @Property()
  openSubtitlesId?: string; // TODO: Separate entity for external providers?

  getVfsFileName(): string {
    throw new Error("SubtitleEntry vfsFileName not implemented yet");
  }
}
