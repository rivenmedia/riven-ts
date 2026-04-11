import { BigIntResolver } from "graphql-scalars";
import { Field, GraphQLISODateTime, Int, ObjectType } from "type-graphql";

import type { Stats } from "@zkochan/fuse-native";

@ObjectType()
export class VfsEntryStat implements Omit<
  Stats,
  "blksize" | "dev" | "rdev" | "ino" | "blocks"
> {
  @Field(() => GraphQLISODateTime)
  mtime!: Date;

  @Field(() => GraphQLISODateTime)
  ctime!: Date;

  @Field(() => GraphQLISODateTime)
  atime!: Date;

  @Field(() => Int)
  mode!: number;

  @Field(() => Int)
  nlink!: number;

  @Field(() => BigIntResolver)
  size!: number;

  @Field(() => Int)
  uid = process.getuid?.() ?? 0;

  @Field(() => Int)
  gid = process.getgid?.() ?? 0;
}
