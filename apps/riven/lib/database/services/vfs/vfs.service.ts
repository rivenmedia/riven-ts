import {
  CreateRequestContext,
  EnsureRequestContext,
} from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";
import { PathInfo } from "./schemas/path-info.schema.ts";
import { getVfsDirectoryEntryPaths } from "./utilities/get-vfs-directory-entry-paths.ts";
import { getVfsEntryStat } from "./utilities/get-vfs-entry-stat.ts";
import { getVfsMediaEntry } from "./utilities/get-vfs-media-entry.ts";
import { getVfsSubtitleEntry } from "./utilities/get-vfs-subtitle-entry.ts";

import type { FindOneOptions } from "@mikro-orm/core";
import type { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

export class VfsService extends BaseService {
  parsePath(path: string) {
    return PathInfo.parse(path);
  }

  @EnsureRequestContext()
  async getMediaEntry<
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
  >(
    pathInfo: PathInfo,
    options?: FindOneOptions<MediaEntry, Hint, Fields, Excludes>,
  ) {
    return getVfsMediaEntry(this.em, pathInfo, options);
  }

  @EnsureRequestContext()
  async getSubtitleEntry(pathInfo: PathInfo) {
    return getVfsSubtitleEntry(this.em, pathInfo);
  }

  @CreateRequestContext()
  async getVfsEntry(path: string) {
    const pathInfo = this.parsePath(path);

    if (pathInfo.pathType === "subtitle-file") {
      return this.getSubtitleEntry(pathInfo);
    }

    return this.getMediaEntry(pathInfo);
  }

  @CreateRequestContext()
  async getEntryStat(path: string) {
    return getVfsEntryStat(this.em, path);
  }

  @CreateRequestContext()
  async getDirectoryEntryPaths(path: string) {
    return getVfsDirectoryEntryPaths(this.em, path);
  }
}
