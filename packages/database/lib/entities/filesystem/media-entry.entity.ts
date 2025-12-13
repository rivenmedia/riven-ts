import { ChildEntity, Column, Index } from "typeorm";
import { FileSystemEntry } from "./filesystem-entry.entity";

class MediaMetadata {}

@ChildEntity()
export class MediaEntry extends FileSystemEntry {
  @Index()
  @Column()
  originalFilename: string;

  // ------------------------
  // Debrid service fields
  // TODO: separate entity?
  // ------------------------

  @Column()
  downloadUrl?: string;

  @Column()
  unrestrictedUrl?: string;

  @Column()
  provider?: string;

  @Column()
  providerDownloadId?: string;

  // ------------------------

  @Column("json")
  libraryProfiles?: string[];

  @Column("json")
  mediaMetadata?: MediaMetadata;

  @Column({ default: false })
  isDirectory: boolean;
}
