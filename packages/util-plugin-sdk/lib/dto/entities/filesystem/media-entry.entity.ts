import { Field, ObjectType } from "type-graphql";
import { ChildEntity, Column, Index } from "typeorm";

import { FileSystemEntry } from "./filesystem-entry.entity.ts";

@ObjectType()
@ChildEntity()
export class MediaEntry extends FileSystemEntry {
  @Field()
  @Index()
  @Column()
  originalFilename!: string;

  // ------------------------
  // Debrid service fields
  // TODO: separate entity?
  // ------------------------

  @Field({ nullable: true })
  @Column({ nullable: true })
  downloadUrl?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unrestrictedUrl?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  provider?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  providerDownloadId?: string;

  // ------------------------

  @Field(() => [String], { nullable: true })
  @Column("json", { nullable: true })
  libraryProfiles?: string[];

  @Field(() => String, { nullable: true })
  @Column("json", { nullable: true })
  mediaMetadata?: object;

  @Field()
  @Column({ default: false })
  isDirectory!: boolean;
}
