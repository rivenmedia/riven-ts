/**
 * In-process cache of library section definitions and their membership.
 *
 * ## Why membership is computed in JS rather than SQL
 *
 * The rule field set includes `MediaItem.isAnime`, a non-persisted getter, and
 * `Stream.parsedData`, a jsonb blob. Neither translates to a `WHERE` clause
 * that behaves identically on Postgres (production, `text[]` genres) and SQLite
 * (tests, JSON genres), so rules are evaluated in JS over pre-built facts.
 *
 * ## Why this is affordable
 *
 * One `em.stream()` pass over the library builds membership for *every* enabled
 * section at once, so I/O is O(items) rather than O(items x sections), and
 * memory stays flat regardless of library size. The result is two sets of ID
 * tokens per section — a few tens of bytes per item — which is what gets
 * cached, not the hydrated entities. Readdir and getattr then answer from a set
 * lookup with no query at all.
 *
 * Freshness is driven by explicit invalidation (section writes, and
 * `riven.media-item.download.success`), not by the TTL. The TTL is only a
 * backstop against a missed invalidation point.
 *
 * ## If this stops being fast enough
 *
 * 1. Add a `library_section_item (section_id, media_item_id)` join table.
 * 2. Materialise it by calling the *unchanged* `evaluateRule` on the same
 *    triggers, plus a periodic job for rules using `inLastDays`.
 * 3. Replace `membership()` with a query against that table.
 *
 * `evaluateRule` is pure and synchronous over a pre-built `ItemFacts` precisely
 * so that step 2 needs no rule-logic changes.
 *
 * ## Single-process assumption
 *
 * This cache lives in the core process, which is also where the VFS and the
 * GraphQL server run, so an in-memory cache is coherent. If Riven ever runs
 * multiple API replicas, invalidation must move to Redis pub/sub.
 */

import {
  LibrarySection,
  Movie,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { LRUCache } from "lru-cache";
import { DateTime } from "luxon";

import {
  buildItemFacts,
  loadMovieAggregates,
  loadShowAggregates,
} from "./utilities/build-item-facts.ts";
import { evaluateRule } from "./utilities/evaluate-rule.ts";

import type { ItemFacts } from "./utilities/item-facts.ts";
import type { EntityManager } from "@mikro-orm/core";
import type { LibrarySectionMediaType } from "@repo/util-plugin-sdk/dto/entities";
import type { LibrarySectionRule } from "@repo/util-plugin-sdk/schemas/library-section/index";
import type { UUID } from "node:crypto";

/** Backstop only — freshness comes from explicit invalidation. */
const MEMBERSHIP_TTL_MS = 900_000;

/** A section flattened for use on the filesystem hot path. */
export interface SectionDescriptor {
  id: UUID;
  slug: string;
  name: string;
  mediaTypes: LibrarySectionMediaType[];
  split: boolean;
  enabled: boolean;
  sortOrder: number;
  rule: LibrarySectionRule | null;
  include: ReadonlySet<UUID>;
  exclude: ReadonlySet<UUID>;
  createdAt: Date;
  updatedAt: Date | null;

  /** The directories this section exposes, relative to the VFS root. */
  directories: string[];
}

/**
 * Which items belong to a section, keyed by the same ID tokens that appear in
 * VFS directory names, so a path can be tested without touching the database.
 */
export interface SectionMembership {
  movieTmdbIds: ReadonlySet<string>;
  showTvdbIds: ReadonlySet<string>;
}

const TMDB_TOKEN_PATTERN = /\{tmdb-(?<tmdbId>\d+)\}/u;
const TVDB_TOKEN_PATTERN = /\{tvdb-(?<tvdbId>\d+)\}/u;

/**
 * Whether a VFS entry name belongs to a section.
 *
 * Entry names embed the provider ID (`Alien (1979) {tmdb-348}`), which is
 * exactly what membership is keyed on. Names carrying neither token are kept:
 * they are not item directories, so a section has no opinion on them.
 */
export const membershipIncludesEntryName = (
  membership: SectionMembership,
  name: string,
): boolean => {
  const tmdbId = TMDB_TOKEN_PATTERN.exec(name)?.groups?.["tmdbId"];

  if (tmdbId !== undefined) {
    return membership.movieTmdbIds.has(tmdbId);
  }

  const tvdbId = TVDB_TOKEN_PATTERN.exec(name)?.groups?.["tvdbId"];

  if (tvdbId !== undefined) {
    return membership.showTvdbIds.has(tvdbId);
  }

  return true;
};

/** Overrides beat the rule. Exclusion wins, though the unique index prevents both. */
const isMember = (
  section: SectionDescriptor,
  facts: ItemFacts,
  now: number,
): boolean => {
  if (section.exclude.has(facts.id)) {
    return false;
  }

  if (section.include.has(facts.id)) {
    return true;
  }

  return evaluateRule(section.rule, facts, now);
};

const toDescriptor = (section: LibrarySection): SectionDescriptor => {
  const include = new Set<UUID>();
  const exclude = new Set<UUID>();

  for (const override of section.overrides) {
    const target = override.mode === "include" ? include : exclude;

    target.add(override.mediaItem.id);
  }

  return {
    id: section.id,
    slug: section.slug,
    name: section.name,
    mediaTypes: section.mediaTypes,
    split: section.split,
    enabled: section.enabled,
    sortOrder: section.sortOrder,
    rule: section.rule ?? null,
    include,
    exclude,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt ?? null,
    directories: section.getVfsDirectories(),
  };
};

class SectionRegistry {
  #sections: ReadonlyMap<string, SectionDescriptor> | null = null;
  #loadingSections: Promise<ReadonlyMap<string, SectionDescriptor>> | null =
    null;

  readonly #membership = new LRUCache<
    "all",
    ReadonlyMap<UUID, SectionMembership>
  >({
    ttl: MEMBERSHIP_TTL_MS,
    max: 1,
  });
  #loadingMembership: Promise<ReadonlyMap<UUID, SectionMembership>> | null =
    null;

  /** All sections, enabled or not, keyed by slug. Concurrent callers share one query. */
  public async snapshot(
    em: EntityManager,
  ): Promise<ReadonlyMap<string, SectionDescriptor>> {
    if (this.#sections) {
      return this.#sections;
    }

    this.#loadingSections ??= this.#loadSections(em).finally(() => {
      this.#loadingSections = null;
    });

    return this.#loadingSections;
  }

  /** Enabled sections in listing order: by `sortOrder`, then slug. */
  public async enabledSections(em: EntityManager) {
    const sections = await this.snapshot(em);

    return [...sections.values()]
      .filter((section) => section.enabled)
      .toSorted(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.slug.localeCompare(right.slug),
      );
  }

  /** Membership for every enabled section, built in a single sweep. */
  public async membership(
    em: EntityManager,
  ): Promise<ReadonlyMap<UUID, SectionMembership>> {
    const cached = this.#membership.get("all");

    if (cached) {
      return cached;
    }

    this.#loadingMembership ??= this.#buildMembership(em).finally(() => {
      this.#loadingMembership = null;
    });

    return this.#loadingMembership;
  }

  public async membershipFor(em: EntityManager, sectionId: UUID) {
    const all = await this.membership(em);

    return all.get(sectionId);
  }

  /** Drops everything. Call after any write to a section or its overrides. */
  public invalidate() {
    this.#sections = null;
    this.#loadingSections = null;
    this.#membership.clear();
  }

  /**
   * Drops only membership, leaving section definitions cached.
   *
   * For events that change the library rather than the sections, such as a
   * download completing.
   */
  public invalidateMembership() {
    this.#membership.clear();
  }

  async #loadSections(em: EntityManager) {
    const sections = await em.find(
      LibrarySection,
      {},
      { populate: ["overrides"] },
    );

    const bySlug = new Map<string, SectionDescriptor>(
      sections.map((section) => [section.slug, toDescriptor(section)]),
    );

    this.#sections = bySlug;

    return bySlug;
  }

  async #buildMembership(em: EntityManager) {
    const sections = await this.enabledSections(em);
    const result = new Map<UUID, { movies: Set<string>; shows: Set<string> }>(
      sections.map((section) => [
        section.id,
        { movies: new Set<string>(), shows: new Set<string>() },
      ]),
    );

    if (sections.length > 0) {
      // Swept on a fork so the hydrated library does not land in the caller's
      // identity map, and is discarded wholesale when the sweep finishes.
      const sweepEm = em.fork();

      try {
        const now = DateTime.utc().toMillis();
        const movieSections = sections.filter((section) =>
          section.mediaTypes.includes("movie"),
        );
        const showSections = sections.filter((section) =>
          section.mediaTypes.includes("show"),
        );

        if (movieSections.length > 0) {
          const aggregates = await loadMovieAggregates(sweepEm);

          // Items with no media file can never appear in the VFS, so they are
          // excluded by the query rather than evaluated and discarded.
          const movies = sweepEm.stream(Movie, {
            where: { filesystemEntries: { $some: { type: "media" } } },
            populate: ["activeStream"],
          });

          for await (const movie of movies) {
            const facts = buildItemFacts(movie, aggregates);

            for (const section of movieSections) {
              if (isMember(section, facts, now)) {
                result.get(section.id)?.movies.add(movie.tmdbId);
              }
            }
          }
        }

        if (showSections.length > 0) {
          const aggregates = await loadShowAggregates(sweepEm);

          const shows = sweepEm.stream(Show, {
            where: {
              seasons: {
                episodes: { filesystemEntries: { $some: { type: "media" } } },
              },
            },
            populate: ["activeStream"],
          });

          for await (const show of shows) {
            const facts = buildItemFacts(show, aggregates);

            for (const section of showSections) {
              if (isMember(section, facts, now)) {
                result.get(section.id)?.shows.add(show.tvdbId);
              }
            }
          }
        }
      } finally {
        sweepEm.clear();
      }
    }

    const membership = new Map<UUID, SectionMembership>(
      [...result].map(([id, { movies, shows }]) => [
        id,
        { movieTmdbIds: movies, showTvdbIds: shows },
      ]),
    );

    this.#membership.set("all", membership);

    return membership;
  }
}

export const librarySectionRegistry = new SectionRegistry();
