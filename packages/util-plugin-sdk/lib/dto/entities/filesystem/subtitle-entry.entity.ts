import { Field, ObjectType } from "type-graphql";
import { ChildEntity, Column, Index } from "typeorm";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

@ObjectType()
@ChildEntity()
export class SubtitleEntry extends FileSystemEntry {
  @Field()
  @Index()
  @Column()
  language!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  parentOriginalFilename?: string;

  @Field()
  @Column()
  content!: string;

  @Field()
  @Column()
  fileHash!: string;

  @Field()
  @Column()
  videoFileSize!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  openSubtitlesId?: string; // TODO: Separate entity for external providers?
}
