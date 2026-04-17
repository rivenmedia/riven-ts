import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { EnsureRequestContext } from "@mikro-orm/decorators/legacy";

import { BaseService } from "../base-service.ts";
import { getVfsDirectoryEntryPaths } from "./utilities/get-vfs-directory-entry-paths.ts";
import { getVfsEntryStat } from "./utilities/get-vfs-entry-stat.ts";
import { getVfsEntry } from "./utilities/get-vfs-entry.ts";

import type { UUID } from "node:crypto";

export class VfsService extends BaseService {
  @EnsureRequestContext()
  async getEntry(path: string) {
    return getVfsEntry(this.em.getContext(), path);
  }

  @EnsureRequestContext()
  async getEntryStat(path: string) {
    return getVfsEntryStat(this.em.getContext(), path);
  }

  @EnsureRequestContext()
  async getDirectoryEntryPaths(path: string) {
    return getVfsDirectoryEntryPaths(this.em.getContext(), path);
  }

  @EnsureRequestContext()
  async saveStreamUrl(entryId: UUID, streamUrl: string) {
    return this.em
      .getContext()
      .getRepository(MediaEntry)
      .saveStreamUrl(entryId, streamUrl);
  }
}
