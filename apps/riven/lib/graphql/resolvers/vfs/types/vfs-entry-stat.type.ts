import { BigIntResolver } from "graphql-scalars";
import { Field, GraphQLISODateTime, Int, ObjectType } from "type-graphql";

import type { Stats } from "@zkochan/fuse-native";

@ObjectType()
export class VfsEntryStat implements Omit<
  Stats,
  "blksize" | "dev" | "rdev" | "ino" | "blocks"
> {
  @Field(() => GraphQLISODateTime)
  public mtime!: Date;

  @Field(() => GraphQLISODateTime)
  public ctime!: Date;

  @Field(() => GraphQLISODateTime)
  public atime!: Date;

  @Field(() => Int)
  public mode!: number;

  @Field(() => Int)
  public nlink!: number;

  @Field(() => BigIntResolver)
  public size!: number;

  @Field(() => Int)
  public uid = process.getuid?.() ?? 0;

  @Field(() => Int)
  public gid = process.getgid?.() ?? 0;
}
