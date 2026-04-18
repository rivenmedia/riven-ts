import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Query, Resolver } from "type-graphql";

import { database } from "../../../database/database.ts";
import { VfsEntryStat } from "./types/vfs-entry-stat.type.ts";

@Resolver()
export class VfsResolver {
  @Query(() => VfsEntryStat)
  vfsEntryStat(@Arg("path") path: string): Promise<VfsEntryStat> {
    return database.services.vfsService.getEntryStat(path);
  }

  @Query(() => MediaEntry, { nullable: true })
  vfsEntry(@Arg("path") path: string): Promise<MediaEntry | null> {
    return database.services.vfsService.getEntry(path);
  }

  @Query(() => [String])
  vfsDirectoryEntryPaths(@Arg("path") path: string): Promise<string[]> {
    return database.services.vfsService.getDirectoryEntryPaths(path);
  }
}
