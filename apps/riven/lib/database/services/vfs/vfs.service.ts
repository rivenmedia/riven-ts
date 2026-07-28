import {
  CreateRequestContext,
  EnsureRequestContext,
} from "@mikro-orm/decorators/legacy";
import Fuse from "@zkochan/fuse-native";

import { FuseError } from "../../../vfs/errors/fuse-error.ts";
import { BaseService } from "../core/base-service.ts";
import {
  librarySectionRegistry,
  membershipIncludes,
} from "../library-section/section-registry.ts";
import { resolveVfsPath } from "./schemas/vfs-path.schema.ts";
import { getVfsDirectoryEntryPaths } from "./utilities/get-vfs-directory-entry-paths.ts";
import { getVfsEntryStat } from "./utilities/get-vfs-entry-stat.ts";
import { getVfsMediaEntry } from "./utilities/get-vfs-media-entry.ts";
import { getVfsSubtitleEntry } from "./utilities/get-vfs-subtitle-entry.ts";

import type { PathInfo } from "./schemas/path-info.schema.ts";
import type { FindOneOptions } from "@mikro-orm/core";
import type { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

export class VfsService extends BaseService {
  /**
   * Resolves a raw VFS path, stripping any library section prefix and rejecting
   * items that are not members of the section they were reached through.
   *
   * Membership is enforced here rather than left to callers so that reaching an
   * item through a section it does not belong to is impossible by construction.
   *
   * @throws {FuseError} ENOENT when the path names no section or built-in root,
   * or names an item the section excludes.
   */
  @CreateRequestContext()
  public async resolvePath(path: string) {
    const sections = await librarySectionRegistry.snapshot(this.em);
    const resolved = resolveVfsPath(path, sections);

    if (!resolved) {
      throw new FuseError(Fuse.ENOENT, `Unable to resolve VFS path: ${path}`);
    }

    if (resolved.kind === "media" && resolved.section) {
      const membership = await librarySectionRegistry.membershipFor(
        this.em,
        resolved.section.id,
      );

      if (!membershipIncludes(membership, resolved.pathInfo)) {
        throw new FuseError(
          Fuse.ENOENT,
          `Item is not a member of this library section: ${path}`,
        );
      }
    }

    return resolved;
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
