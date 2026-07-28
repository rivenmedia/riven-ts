import {
  LIBRARY_SECTION_SLUG_PATTERN,
  LibrarySection,
  LibrarySectionOverride,
  librarySectionDirectoryFor,
  MediaItem,
  Movie,
} from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";
import { kebabCase } from "es-toolkit";

import { BaseService } from "../core/base-service.ts";
import { NAMESPACE_BY_MEDIA_TYPE } from "../vfs/schemas/persistent-directory.schema.ts";
import { librarySectionRegistry } from "./section-registry.ts";

import type { EntityData } from "@mikro-orm/core";
import type { LibrarySectionMediaType } from "@repo/util-plugin-sdk/dto/entities";
import type { LibrarySectionOverrideMode } from "@repo/util-plugin-sdk/dto/enums/library-section-override-mode.enum";
import type { LibrarySectionRule } from "@repo/util-plugin-sdk/schemas/library-section/index";
import type { UUID } from "node:crypto";

/** Would shadow the built-in VFS roots. */
const RESERVED_SLUGS = new Set(["movies", "shows"]);

// Optionals are explicitly widened with `| undefined` because the project
// enables `exactOptionalPropertyTypes`, and callers build these as patch
// objects where an absent field is naturally `undefined`.
export interface CreateLibrarySectionData {
  name: string;
  slug?: string | undefined;
  mediaTypes: LibrarySectionMediaType[];
  split?: boolean | undefined;
  rule?: LibrarySectionRule | null | undefined;
  enabled?: boolean | undefined;
  sortOrder?: number | undefined;
}

export type UpdateLibrarySectionData = Partial<CreateLibrarySectionData>;

export class LibrarySectionError extends Error {
  public override readonly name = "LibrarySectionError";
}

/**
 * A value that is already a legal slug is taken verbatim. Running `kebabCase`
 * unconditionally would mangle it — it splits at digit/letter boundaries, so an
 * explicit "4k-remux" would come back as "4-k-remux" and the caller could never
 * get the directory name they asked for.
 *
 * Rejected here rather than left to the unique index or the entity's `@Matches`
 * so that the caller gets a message naming the actual problem.
 */
export function toSectionSlug(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const slug = LIBRARY_SECTION_SLUG_PATTERN.test(trimmed)
    ? trimmed
    : kebabCase(trimmed);

  if (!LIBRARY_SECTION_SLUG_PATTERN.test(slug)) {
    throw new LibrarySectionError(
      `"${value}" cannot be used as a directory name. Use lowercase letters, numbers and hyphens.`,
    );
  }

  if (RESERVED_SLUGS.has(slug)) {
    throw new LibrarySectionError(
      `"${slug}" is reserved for the built-in library and cannot be used as a section name.`,
    );
  }

  return slug;
}

export class LibrarySectionService extends BaseService {
  @CreateRequestContext()
  public async findAll({ enabledOnly = false } = {}) {
    return this.em.find(LibrarySection, enabledOnly ? { enabled: true } : {}, {
      populate: ["overrides"],
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    });
  }

  @CreateRequestContext()
  public async findById(id: UUID) {
    return this.em.findOne(LibrarySection, { id }, { populate: ["overrides"] });
  }

  @CreateRequestContext()
  @Transactional()
  public async create(data: CreateLibrarySectionData) {
    const slug = toSectionSlug(data.slug ?? data.name);

    await this.#assertSlugAvailable(slug);

    const section = this.em.create(LibrarySection, {
      name: data.name,
      slug,
      mediaTypes: data.mediaTypes,
      split: data.split ?? true,
      rule: data.rule ?? null,
      enabled: data.enabled ?? true,
      sortOrder: data.sortOrder ?? 0,
    });

    await this.em.flush();

    librarySectionRegistry.invalidate();

    return section;
  }

  @CreateRequestContext()
  @Transactional()
  public async update(id: UUID, data: UpdateLibrarySectionData) {
    const section = await this.em.findOneOrFail(LibrarySection, { id });
    const slug = data.slug === undefined ? undefined : toSectionSlug(data.slug);

    if (slug !== undefined && slug !== section.slug) {
      await this.#assertSlugAvailable(slug);
    }

    // `ignoreUndefined` skips absent fields but still applies an explicit
    // `rule: null`, which is how a rule is cleared.
    this.em.assign<LibrarySection>(
      section,
      {
        ...data,
        ...(slug !== undefined && { slug }),
      } as EntityData<LibrarySection>,
      { ignoreUndefined: true },
    );

    await this.em.flush();

    librarySectionRegistry.invalidate();

    return section;
  }

  @CreateRequestContext()
  @Transactional()
  public async delete(id: UUID) {
    const section = await this.em.findOne(LibrarySection, { id });

    if (!section) {
      return false;
    }

    this.em.remove(section);
    await this.em.flush();

    librarySectionRegistry.invalidate();

    return true;
  }

  @CreateRequestContext()
  @Transactional()
  public async reorder(ids: UUID[]) {
    const sections = await this.em.find(LibrarySection, { id: { $in: ids } });

    for (const section of sections) {
      section.sortOrder = ids.indexOf(section.id);
    }

    await this.em.flush();

    librarySectionRegistry.invalidate();

    return sections;
  }

  @CreateRequestContext()
  @Transactional()
  public async setOverride(
    sectionId: UUID,
    mediaItemId: UUID,
    mode: LibrarySectionOverrideMode,
  ) {
    const section = await this.em.findOneOrFail(LibrarySection, {
      id: sectionId,
    });
    const mediaItem = await this.em.findOneOrFail(MediaItem, {
      id: mediaItemId,
    });

    const existing = await this.em.findOne(LibrarySectionOverride, {
      section: sectionId,
      mediaItem: mediaItemId,
    });

    if (existing) {
      existing.mode = mode;
    } else {
      this.em.create(LibrarySectionOverride, {
        section: this.em.getReference(LibrarySection, section.id),
        mediaItem: this.em.getReference(MediaItem, mediaItem.id),
        mode,
      });
    }

    await this.em.flush();

    librarySectionRegistry.invalidate();

    return section;
  }

  @CreateRequestContext()
  @Transactional()
  public async clearOverride(sectionId: UUID, mediaItemId: UUID) {
    await this.em.nativeDelete(LibrarySectionOverride, {
      section: sectionId,
      mediaItem: mediaItemId,
    });

    librarySectionRegistry.invalidate();

    return this.em.findOneOrFail(LibrarySection, { id: sectionId });
  }

  /**
   * Every VFS directory an item is currently visible in, including the built-in
   * root.
   *
   * Used to tell Plex and Jellyfin which paths to refresh after a download,
   * since an item now lives at one path per matching section.
   */
  @CreateRequestContext()
  public async getVfsDirectoriesFor(mediaItemId: UUID): Promise<string[]> {
    // The library changed to produce this call, so cached membership predates it.
    librarySectionRegistry.invalidateMembership();

    const [membership, sections, item] = await Promise.all([
      librarySectionRegistry.membership(this.em),
      librarySectionRegistry.enabledSections(this.em),
      this.em.findOne(MediaItem, { id: mediaItemId }),
    ]);

    if (!item) {
      return [];
    }

    // Episodes carry their show's tvdbId directly, so a downloaded episode
    // resolves to the same token its show is keyed on.
    const isMovie = item instanceof Movie;
    const token = isMovie ? item.tmdbId : (item as { tvdbId?: string }).tvdbId;
    const mediaType = isMovie ? "movie" : "show";
    const directories = new Set<string>([NAMESPACE_BY_MEDIA_TYPE[mediaType]]);

    if (token === undefined) {
      return [...directories];
    }

    for (const section of sections) {
      const sectionMembership = membership.get(section.id);

      if (!sectionMembership) {
        continue;
      }

      const belongs = isMovie
        ? sectionMembership.movieTmdbIds.has(token)
        : sectionMembership.showTvdbIds.has(token);

      if (belongs) {
        const directory = librarySectionDirectoryFor(section, mediaType);

        if (directory !== null) {
          directories.add(directory);
        }
      }
    }

    return [...directories];
  }

  async #assertSlugAvailable(slug: string) {
    const existing = await this.em.findOne(LibrarySection, { slug });

    if (existing) {
      throw new LibrarySectionError(
        `A library section using the directory name "${slug}" already exists.`,
      );
    }
  }
}
