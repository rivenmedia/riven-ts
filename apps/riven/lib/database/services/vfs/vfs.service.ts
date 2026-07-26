import {
  CreateRequestContext,
  EnsureRequestContext,
} from "@mikro-orm/decorators/legacy";
import Fuse from "@zkochan/fuse-native";

import { FuseError } from "../../../vfs/errors/fuse-error.ts";
import { BaseService } from "../core/base-service.ts";
import { librarySectionRegistry } from "../library-section/section-registry.ts";
import { resolveVfsPath } from "./schemas/vfs-path.schema.ts";
import { getVfsDirectoryEntryPaths } from "./utilities/get-vfs-directory-entry-paths.ts";
import { getVfsEntryStat } from "./utilities/get-vfs-entry-stat.ts";
import { getVfsMediaEntry } from "./utilities/get-vfs-media-entry.ts";
import { getVfsSubtitleEntry } from "./utilities/get-vfs-subtitle-entry.ts";

import type { PathInfo } from "./schemas/path-info.schema.ts";
import type { ResolvedVfsPath } from "./schemas/vfs-path.schema.ts";
import type { FindOneOptions } from "@mikro-orm/core";
import type { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

export class VfsService extends BaseService {
  /**
   * Resolves a raw VFS path, stripping any library section prefix.
   *
   * @throws {FuseError} ENOENT when the path names no section or built-in root.
   */
  @CreateRequestContext()
  public async resolvePath(path: string) {
    const sections = await librarySectionRegistry.snapshot(this.em);
    const resolved = resolveVfsPath(path, sections);

    if (!resolved) {
      throw new FuseError(Fuse.ENOENT, `Unable to resolve VFS path: ${path}`);
    }

    return resolved;
  }

  /**
   * Whether a resolved path's item is a member of the section it was reached
   * through. Always true for the built-in roots.
   */
  @EnsureRequestContext()
  public async isVisibleInSection(resolved: ResolvedVfsPath) {
    if (resolved.kind !== "media" || !resolved.section) {
      return true;
    }

    const membership = await librarySectionRegistry.membershipFor(
      this.em,
      resolved.section.id,
    );
    const { tmdbId, tvdbId } = resolved.pathInfo;

    if (tmdbId !== undefined) {
      return membership?.movieTmdbIds.has(tmdbId) ?? false;
    }

    if (tvdbId !== undefined) {
      return membership?.showTvdbIds.has(tvdbId) ?? false;
    }

    return true;
  }

  @EnsureRequestContext()
  public async getMediaEntry<
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
  public async getSubtitleEntry(pathInfo: PathInfo) {
    return getVfsSubtitleEntry(this.em, pathInfo);
  }

  @CreateRequestContext()
  public async getVfsEntry(path: string) {
    const resolved = await this.resolvePath(path);

    if (resolved.kind !== "media") {
      throw new FuseError(Fuse.EISDIR, `Not a file: ${path}`);
    }

    const { pathInfo } = resolved;

    if (pathInfo.pathType === "subtitle-file") {
      return this.getSubtitleEntry(pathInfo);
    }

    return this.getMediaEntry(pathInfo);
  }

  @CreateRequestContext()
  public async getEntryStat(path: string) {
    return getVfsEntryStat(this.em, path);
  }

  @CreateRequestContext()
  public async getDirectoryEntryPaths(path: string) {
    return getVfsDirectoryEntryPaths(this.em, path);
  }
}
