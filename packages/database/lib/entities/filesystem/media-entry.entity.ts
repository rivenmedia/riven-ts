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

  @Column({ nullable: true })
  downloadUrl?: string;

  @Column({ nullable: true })
  unrestrictedUrl?: string;

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true })
  providerDownloadId?: string;

  // ------------------------

  @Column("json", { nullable: true })
  libraryProfiles?: string[];

  @Column("json", { nullable: true })
  mediaMetadata?: MediaMetadata;

  @Column({ default: false })
  isDirectory: boolean;
}
