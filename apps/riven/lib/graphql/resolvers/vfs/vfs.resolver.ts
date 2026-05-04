import { FileSystemEntryUnion } from "@repo/util-plugin-sdk/dto/unions/filesystem-entry.union";

import { Arg, Query, Resolver } from "type-graphql";

import { services } from "../../../database/database.ts";
import { VfsEntryStat } from "./types/vfs-entry-stat.type.ts";

@Resolver()
export class VfsResolver {
  @Query(() => VfsEntryStat)
  vfsEntryStat(@Arg("path") path: string): Promise<VfsEntryStat> {
    return services.vfsService.getEntryStat(path);
  }

  @Query(() => FileSystemEntryUnion, { nullable: true })
  vfsEntry(
    @Arg("path") path: string,
  ): Promise<typeof FileSystemEntryUnion | null> {
    return services.vfsService.getVfsEntry(path);
  }

  @Query(() => [String])
  vfsDirectoryEntryPaths(@Arg("path") path: string): Promise<string[]> {
    return services.vfsService.getDirectoryEntryPaths(path);
  }
}
