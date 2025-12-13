import { ChildEntity, Column, Index } from "typeorm";
import { FileSystemEntry } from "./filesystem-entry.entity";

@ChildEntity()
export class SubtitleEntry extends FileSystemEntry {
  @Index()
  @Column()
  language: string;

  @Column()
  parentOriginalFilename?: string;

  @Column()
  content: string;

  @Column()
  fileHash: string;

  @Column()
  videoFileSize: number;

  @Column()
  openSubtitlesId?: string; // TODO: Separate entity for external providers?
}
