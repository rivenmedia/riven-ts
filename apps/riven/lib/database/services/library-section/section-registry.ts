/**
 * In-process cache of library section definitions and their membership.
 *
 * Membership is computed in JS rather than SQL because the rule field set
 * includes `MediaItem.isAnime`, a non-persisted getter, and `Stream.parsedData`,
 * a jsonb blob. Neither translates to a `WHERE` clause that behaves identically
 * on Postgres (production, `text[]` genres) and SQLite (tests, JSON genres).
 *
 * One sweep builds membership for every enabled section at once, so I/O is
 * O(items) rather than O(items x sections), and what gets cached is two sets of
 * ID tokens per section rather than the hydrated entities.
 *
 * The cache is coherent only because the VFS, the GraphQL server and the job
 * workers share one process. Running multiple API replicas would require moving
 * invalidation to Redis pub/sub.
 */

import {
  LibrarySection,
  Movie,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import { parseProviderToken } from "../vfs/schemas/path-info.schema.ts";
import {
  buildItemFacts,
  loadMovieAggregates,
  loadShowAggregates,
} from "./utilities/build-item-facts.ts";
import { evaluateRule } from "./utilities/evaluate-rule.ts";

import type { ItemAggregates } from "./utilities/build-item-facts.ts";
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
  mediaTypes: LibrarySectionMediaType[];
  split: boolean;
  enabled: boolean;
  sortOrder: number;
  rule: LibrarySectionRule | null;
  include: ReadonlySet<UUID>;
  exclude: ReadonlySet<UUID>;
}

/**
 * Which items belong to a section, keyed by the same provider tokens that
 * appear in VFS directory names, so a path can be tested without a query.
 */
export interface SectionMembership {
  movieTmdbIds: ReadonlySet<string>;
  showTvdbIds: ReadonlySet<string>;
}

/** Returned instead of `undefined` so callers need no null handling. */
export const EMPTY_MEMBERSHIP: SectionMembership = {
  movieTmdbIds: new Set(),
  showTvdbIds: new Set(),
};

/**
 * Whether a provider token belongs to a section.
 *
 * A name carrying no token is kept: it is not an item directory, so a section
 * has no opinion on it.
 */
export const membershipIncludes = (
  membership: SectionMembership,
  token: { tmdbId?: string | undefined; tvdbId?: string | undefined },
): boolean => {
  if (token.tmdbId !== undefined) {
    return membership.movieTmdbIds.has(token.tmdbId);
  }

  if (token.tvdbId !== undefined) {
    return membership.showTvdbIds.has(token.tvdbId);
  }

  return true;
};

export const membershipIncludesEntryName = (
  membership: SectionMembership,
  name: string,
) => membershipIncludes(membership, parseProviderToken(name));

/** Overrides beat the rule. Exclusion wins, though the unique index prevents both. */
const isMember = (
  section: SectionDescriptor,
  facts: ItemFacts,
  now: number,
) => {
  if (section.exclude.has(facts.id)) {
    return false;
  }

  return (
    section.include.has(facts.id) || evaluateRule(section.rule, facts, now)
  );
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
    mediaTypes: section.mediaTypes,
    split: section.split,
    enabled: section.enabled,
    sortOrder: section.sortOrder,
    rule: section.rule ?? null,
    include,
    exclude,
  };
};

/** One media type's half of the sweep. */
interface SweepPlan<Entity extends Movie | Show> {
  stream: (em: EntityManager) => AsyncIterable<Entity>;
  loadAggregates: (em: EntityManager) => Promise<ItemAggregates>;
  tokenOf: (item: Entity) => string;
  sections: SectionDescriptor[];
}

interface CachedMembership {
  value: ReadonlyMap<UUID, SectionMembership>;
  builtAt: number;
}

class SectionRegistry {
  #sections: ReadonlyMap<string, SectionDescriptor> | null = null;
  #enabled: SectionDescriptor[] | null = null;
  #loadingSections: Promise<ReadonlyMap<string, SectionDescriptor>> | null =
    null;

  #membership: CachedMembership | null = null;
  #loadingMembership: Promise<ReadonlyMap<UUID, SectionMembership>> | null =
    null;

  /** All sections, enabled or not, keyed by slug. Concurrent callers share one query. */
  public async snapshot(em: EntityManager) {
    if (this.#sections) {
      return this.#sections;
    }

    this.#loadingSections ??= this.#loadSections(em).finally(() => {
      this.#loadingSections = null;
    });

    return this.#loadingSections;
  }

  /** Enabled sections, in root listing order. */
  public async enabledSections(em: EntityManager) {
    await this.snapshot(em);

    return this.#enabled ?? [];
  }

  public async membership(em: EntityManager) {
    if (
      this.#membership &&
      DateTime.utc().toMillis() - this.#membership.builtAt < MEMBERSHIP_TTL_MS
    ) {
      return this.#membership.value;
    }

    this.#loadingMembership ??= this.#buildMembership(em).finally(() => {
      this.#loadingMembership = null;
    });

    return this.#loadingMembership;
  }

  public async membershipFor(em: EntityManager, sectionId: UUID) {
    const all = await this.membership(em);

    return all.get(sectionId) ?? EMPTY_MEMBERSHIP;
  }

  /** Call after any write to a section or its overrides. */
  public invalidate() {
    this.#sections = null;
    this.#enabled = null;
    this.#loadingSections = null;
    this.invalidateMembership();
  }

  /** For events that change the library rather than the sections. */
  public invalidateMembership() {
    this.#membership = null;
  }

  async #loadSections(em: EntityManager) {
    const sections = await em.find(
      LibrarySection,
      {},
      { populate: ["overrides"] },
    );

    const descriptors = sections.map((section) => toDescriptor(section));

    this.#sections = new Map(
      descriptors.map((descriptor) => [descriptor.slug, descriptor]),
    );
    this.#enabled = descriptors
      .filter((descriptor) => descriptor.enabled)
      .toSorted(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.slug.localeCompare(right.slug),
      );

    return this.#sections;
  }

  async #buildMembership(em: EntityManager) {
    const sections = await this.enabledSections(em);
    const buckets = new Map<UUID, { movies: Set<string>; shows: Set<string> }>(
      sections.map((section) => [
        section.id,
        { movies: new Set<string>(), shows: new Set<string>() },
      ]),
    );

    await Promise.all([
      this.#sweep(em, buckets, "movies", {
        // Items with no media file can never appear in the VFS.
        stream: (sweepEm) =>
          sweepEm.stream(Movie, {
            where: { filesystemEntries: { $some: { type: "media" } } },
            populate: ["activeStream"],
          }),
        loadAggregates: loadMovieAggregates,
        tokenOf: (movie) => movie.tmdbId,
        sections: sections.filter((section) =>
          section.mediaTypes.includes("movie"),
        ),
      }),
      this.#sweep(em, buckets, "shows", {
        // `$some` at every level so shows are matched by subquery rather than
        // by a join that would yield one row per episode.
        stream: (sweepEm) =>
          sweepEm.stream(Show, {
            where: {
              seasons: {
                $some: {
                  episodes: {
                    $some: {
                      filesystemEntries: { $some: { type: "media" } },
                    },
                  },
                },
              },
            },
            populate: ["activeStream"],
          }),
        loadAggregates: loadShowAggregates,
        tokenOf: (show) => show.tvdbId,
        sections: sections.filter((section) =>
          section.mediaTypes.includes("show"),
        ),
      }),
    ]);

    const membership = new Map<UUID, SectionMembership>(
      [...buckets].map(([id, { movies, shows }]) => [
        id,
        { movieTmdbIds: movies, showTvdbIds: shows },
      ]),
    );

    this.#membership = {
      value: membership,
      builtAt: DateTime.utc().toMillis(),
    };

    return membership;
  }

  async #sweep<Entity extends Movie | Show>(
    parentEm: EntityManager,
    buckets: Map<UUID, { movies: Set<string>; shows: Set<string> }>,
    bucket: "movies" | "shows",
    plan: SweepPlan<Entity>,
  ) {
    if (plan.sections.length === 0) {
      return;
    }

    // A dedicated fork per sweep, so the hydrated library never reaches the
    // caller's identity map and is discarded when the sweep finishes.
    const em = parentEm.fork();
    const aggregates = await plan.loadAggregates(em);
    const now = DateTime.utc().toMillis();
    const targets = plan.sections.map((section) => ({
      section,
      tokens: buckets.get(section.id)?.[bucket],
    }));

    try {
      for await (const item of plan.stream(em)) {
        const facts = buildItemFacts(item, aggregates);

        for (const { section, tokens } of targets) {
          if (isMember(section, facts, now)) {
            tokens?.add(plan.tokenOf(item));
          }
        }
      }
    } finally {
      em.clear();
    }
  }
}

export const librarySectionRegistry = new SectionRegistry();
