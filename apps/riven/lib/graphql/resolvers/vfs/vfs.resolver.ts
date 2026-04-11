import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, Query, Resolver } from "type-graphql";

import { VfsEntryStat } from "./types/vfs-entry-stat.type.ts";
import { getVfsDirectoryEntryPaths } from "./utilities/get-vfs-directory-entry-paths.ts";
import { getVfsEntryStat } from "./utilities/get-vfs-entry-stat.ts";
import { getVfsEntry } from "./utilities/get-vfs-entry.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver()
export class VfsResolver {
  @Query(() => VfsEntryStat)
  async vfsEntryStat(
    @Ctx() { em }: ApolloServerContext,
    @Arg("path") path: string,
  ): Promise<VfsEntryStat> {
    return getVfsEntryStat(em, path);
  }

  @Query(() => MediaEntry, { nullable: true })
  async vfsEntry(
    @Ctx() { em }: ApolloServerContext,
    @Arg("path") path: string,
  ): Promise<MediaEntry | null> {
    return getVfsEntry(em, path);
  }

  @Query(() => [String])
  async vfsDirectoryEntryPaths(
    @Ctx() { em }: ApolloServerContext,
    @Arg("path") path: string,
  ): Promise<string[]> {
    return getVfsDirectoryEntryPaths(em, path);
  }
}
