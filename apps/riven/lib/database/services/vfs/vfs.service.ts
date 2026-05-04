import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  EnsureRequestContext,
} from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";
import { PathInfo } from "./schemas/path-info.schema.js";
import { getVfsDirectoryEntryPaths } from "./utilities/get-vfs-directory-entry-paths.ts";
import { getVfsEntryStat } from "./utilities/get-vfs-entry-stat.ts";
import { getVfsMediaEntry } from "./utilities/get-vfs-media-entry.ts";
import { getVfsSubtitleEntry } from "./utilities/get-vfs-subtitle-entry.ts";

import type { UUID } from "node:crypto";

export class VfsService extends BaseService {
  parsePath(path: string) {
    return PathInfo.parse(path);
  }

  @EnsureRequestContext()
  async getMediaEntry(pathInfo: PathInfo) {
    return getVfsMediaEntry(this.em, pathInfo);
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

  @CreateRequestContext()
  async saveStreamUrl(entryId: UUID, streamUrl: string) {
    return this.em.getRepository(MediaEntry).saveStreamUrl(entryId, streamUrl);
  }
}
