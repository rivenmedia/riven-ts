import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";
import { getVfsDirectoryEntryPaths } from "./utilities/get-vfs-directory-entry-paths.ts";
import { getVfsEntryStat } from "./utilities/get-vfs-entry-stat.ts";
import { getVfsEntry } from "./utilities/get-vfs-entry.ts";

import type { UUID } from "node:crypto";

export class VfsService extends BaseService {
  @CreateRequestContext()
  async getEntry(path: string) {
    return getVfsEntry(this.em, path);
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
