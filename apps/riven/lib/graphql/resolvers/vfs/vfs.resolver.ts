import { FileSystemEntryUnion } from "@repo/util-plugin-sdk/dto/unions/filesystem-entry.union";

import { Injectable } from "@nestjs/common";
import { Arg, Query, Resolver } from "type-graphql";

import { VfsService } from "../../../database/services/vfs/vfs.service.ts";
import { VfsEntryStat } from "./types/vfs-entry-stat.type.ts";

@Injectable()
@Resolver()
export class VfsResolver {
  private readonly vfsService: VfsService;

  public constructor(vfsService: VfsService) {
    this.vfsService = vfsService;
  }

  @Query(() => VfsEntryStat)
  public async vfsEntryStat(@Arg("path") path: string): Promise<VfsEntryStat> {
    return this.vfsService.getEntryStat(path);
  }

  @Query(() => FileSystemEntryUnion, { nullable: true })
  public async vfsEntry(
    @Arg("path") path: string,
  ): Promise<typeof FileSystemEntryUnion | null> {
    return this.vfsService.getVfsEntry(path);
  }

  @Query(() => [String])
  public async vfsDirectoryEntryPaths(
    @Arg("path") path: string,
  ): Promise<string[]> {
    return this.vfsService.getDirectoryEntryPaths(path);
  }
}
