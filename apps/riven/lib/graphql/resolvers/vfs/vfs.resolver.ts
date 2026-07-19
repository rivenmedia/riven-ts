import { FileSystemEntryUnion } from "@repo/util-plugin-sdk/dto/unions/filesystem-entry.union";

import { Arg, Query, Resolver } from "type-graphql";

import { CoreContext } from "../../decorators/core-context.ts";
import { VfsEntryStat } from "./types/vfs-entry-stat.type.ts";

@Resolver()
export class VfsResolver {
  @Query(() => VfsEntryStat)
  async vfsEntryStat(
    @CoreContext() { services }: CoreContext,
    @Arg("path") path: string,
  ): Promise<VfsEntryStat> {
    return services.vfsService.getEntryStat(path);
  }

  @Query(() => FileSystemEntryUnion, { nullable: true })
  async vfsEntry(
    @CoreContext() { services }: CoreContext,
    @Arg("path") path: string,
  ): Promise<typeof FileSystemEntryUnion | null> {
    return services.vfsService.getVfsEntry(path);
  }

  @Query(() => [String])
  async vfsDirectoryEntryPaths(
    @CoreContext() { services }: CoreContext,
    @Arg("path") path: string,
  ): Promise<string[]> {
    return services.vfsService.getDirectoryEntryPaths(path);
  }
}
