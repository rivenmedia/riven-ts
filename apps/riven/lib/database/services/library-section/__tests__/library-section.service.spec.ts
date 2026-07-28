import { LibrarySection, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { describe, expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import {
  LibrarySectionError,
  toSectionSlug,
} from "../library-section.service.ts";
import { librarySectionRegistry } from "../section-registry.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { LibrarySectionRule } from "@repo/util-plugin-sdk/schemas/library-section/index";
import type { UUID } from "node:crypto";

const horrorRule: LibrarySectionRule = {
  type: "condition",
  field: "genres",
  op: "includesAny",
  value: ["horror"],
};

/**
 * Seeds a completed movie and applies metadata to it.
 *
 * The seeders clear the identity map, so the context they return is detached;
 * the movie has to be re-read before it can be modified.
 */
const seedMovie = async (
  em: EntityManager,
  seedCompletedMovie: () => Promise<{ movie: { id: UUID } }>,
  patch: Partial<Pick<Movie, "genres" | "year">> = {},
) => {
  const { movie: seeded } = await seedCompletedMovie();
  const movie = await em.findOneOrFail(Movie, { id: seeded.id });

  Object.assign(movie, patch);
  await em.flush();

  return movie;
};

describe(toSectionSlug, () => {
  it.each([
    ["Horror", "horror"],
    ["Sci-Fi Classics", "sci-fi-classics"],
    ["  Anime Movies  ", "anime-movies"],
  ])("derives %o into %o", (input, expected) => {
    expect(toSectionSlug(input)).toBe(expected);
  });

  it.each([["movies"], ["shows"], ["Movies"]])(
    "rejects the reserved name %o",
    (input) => {
      expect(() => toSectionSlug(input)).toThrow(LibrarySectionError);
    },
  );

  it("rejects a name that cannot produce a usable directory", () => {
    expect(() => toSectionSlug("...")).toThrow(LibrarySectionError);
  });

  it.each([["4k-remux"], ["horror"], ["sci-fi-classics"]])(
    "takes an already-legal slug %o verbatim",
    (input) => {
      // kebabCase splits at digit/letter boundaries, so re-deriving would turn
      // "4k-remux" into "4-k-remux" and the caller could never get what they asked for.
      expect(toSectionSlug(input)).toBe(input);
    },
  );

  it("never produces a slug containing a period", () => {
    // A period would make `path.parse` read the directory as a file.
    expect(toSectionSlug("Sci. Fi.")).not.toContain(".");
  });
});

describe("crud", () => {
  it("creates a section and derives its slug from the name", async ({
    services,
  }) => {
    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie", "show"],
      rule: horrorRule,
    });

    expect(section.slug).toBe("horror");
    expect(section.enabled).toBe(true);
    expect(section.split).toBe(true);
  });

  it("rejects a second section with the same directory name", async ({
    services,
  }) => {
    await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
    });

    await expect(
      services.librarySectionService.create({
        name: "Horror",
        mediaTypes: ["show"],
      }),
    ).rejects.toThrow(LibrarySectionError);
  });

  it("updates a section in place", async ({ services }) => {
    const created = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
    });

    const updated = await services.librarySectionService.update(created.id, {
      name: "Scary Films",
      enabled: false,
    });

    expect(updated.name).toBe("Scary Films");
    expect(updated.enabled).toBe(false);
    // The directory name is not dragged along by a rename.
    expect(updated.slug).toBe("horror");
  });

  it("deletes a section", async ({ services, em }) => {
    const created = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
    });

    await expect(
      services.librarySectionService.delete(created.id),
    ).resolves.toBe(true);
    await expect(em.fork().count(LibrarySection, {})).resolves.toBe(0);
  });

  it("assigns sort order from the given sequence", async ({ services }) => {
    const first = await services.librarySectionService.create({
      name: "Alpha",
      mediaTypes: ["movie"],
    });
    const second = await services.librarySectionService.create({
      name: "Beta",
      mediaTypes: ["movie"],
    });

    const reordered = await services.librarySectionService.reorder([
      second.id,
      first.id,
    ]);

    expect(
      Object.fromEntries(
        reordered.map((section) => [section.slug, section.sortOrder]),
      ),
    ).toStrictEqual({ beta: 0, alpha: 1 });
  });
});

describe("layout", () => {
  it("splits into movies and shows when it holds both", async ({
    services,
  }) => {
    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie", "show"],
      split: true,
    });

    expect(section.getVfsDirectories()).toStrictEqual([
      "horror/movies",
      "horror/shows",
    ]);
  });

  it("stays flat when split is off", async ({ services }) => {
    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie", "show"],
      split: false,
    });

    expect(section.getVfsDirectories()).toStrictEqual(["horror"]);
  });

  it("collapses the subdirectory when it holds a single media type", async ({
    services,
  }) => {
    const section = await services.librarySectionService.create({
      name: "Anime Movies",
      mediaTypes: ["movie"],
      split: true,
    });

    expect(section.getVfsDirectories()).toStrictEqual(["anime-movies"]);
  });
});

describe("membership", () => {
  it("includes only the items its rule matches", async ({
    services,
    em,
    seeders,
  }) => {
    const matching = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Horror", "Thriller"],
    });
    const other = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Comedy"],
    });

    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
      rule: horrorRule,
    });

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(membership.movieTmdbIds.has(matching.tmdbId)).toBe(true);
    expect(membership.movieTmdbIds.has(other.tmdbId)).toBe(false);
  });

  it("matches movie genres despite their provider casing", async ({
    services,
    em,
    seeders,
  }) => {
    // TMDB indexes movie genres in title case; the rule is written lowercase.
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Science Fiction"],
    });

    const section = await services.librarySectionService.create({
      name: "Sci Fi",
      mediaTypes: ["movie"],
      rule: {
        type: "condition",
        field: "genres",
        op: "includes",
        value: "science fiction",
      },
    });

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(membership.movieTmdbIds.has(movie.tmdbId)).toBe(true);
  });

  it("accepts everything of its media types when it has no rule", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie);

    const section = await services.librarySectionService.create({
      name: "Everything",
      mediaTypes: ["movie"],
      rule: null,
    });

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(membership.movieTmdbIds.has(movie.tmdbId)).toBe(true);
  });

  it("ignores items that have no media file", async ({
    services,
    em,
    seeders,
  }) => {
    const scraped = await seeders.seedScrapedMovie();

    const section = await services.librarySectionService.create({
      name: "Everything",
      mediaTypes: ["movie"],
      rule: null,
    });

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(membership.movieTmdbIds.has(scraped.movie.tmdbId)).toBe(false);
  });

  it("keeps shows out of a movies-only section", async ({
    services,
    em,
    completedShowContext,
  }) => {
    const section = await services.librarySectionService.create({
      name: "Everything",
      mediaTypes: ["movie"],
      rule: null,
    });

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(
      membership.showTvdbIds.has(completedShowContext.completedShow.tvdbId),
    ).toBe(false);
  });

  it("includes shows in a shows section", async ({
    services,
    em,
    completedShowContext,
  }) => {
    const section = await services.librarySectionService.create({
      name: "All Shows",
      mediaTypes: ["show"],
      rule: null,
    });

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(
      membership.showTvdbIds.has(completedShowContext.completedShow.tvdbId),
    ).toBe(true);
  });

  it("puts one item in every section that matches it", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Horror"],
      year: 2020,
    });

    const horror = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
      rule: horrorRule,
    });
    const modern = await services.librarySectionService.create({
      name: "Modern",
      mediaTypes: ["movie"],
      rule: { type: "condition", field: "year", op: "gte", value: 2000 },
    });

    const membership = await librarySectionRegistry.membership(em.fork());

    expect(membership.get(horror.id)?.movieTmdbIds).toContain(movie.tmdbId);
    expect(membership.get(modern.id)?.movieTmdbIds).toContain(movie.tmdbId);
  });
});

describe("overrides", () => {
  it("forces a non-matching item into the section", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Comedy"],
    });

    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
      rule: horrorRule,
    });

    await services.librarySectionService.setOverride(
      section.id,
      movie.id,
      "include",
    );

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(membership.movieTmdbIds.has(movie.tmdbId)).toBe(true);
  });

  it("forces a matching item out of the section", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Horror"],
    });

    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
      rule: horrorRule,
    });

    await services.librarySectionService.setOverride(
      section.id,
      movie.id,
      "exclude",
    );

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(membership.movieTmdbIds.has(movie.tmdbId)).toBe(false);
  });

  it("replaces an existing override rather than conflicting with it", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Horror"],
    });

    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
      rule: horrorRule,
    });

    await services.librarySectionService.setOverride(
      section.id,
      movie.id,
      "exclude",
    );
    await services.librarySectionService.setOverride(
      section.id,
      movie.id,
      "include",
    );

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(membership.movieTmdbIds.has(movie.tmdbId)).toBe(true);
  });

  it("restores rule-driven membership when cleared", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Horror"],
    });

    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
      rule: horrorRule,
    });

    await services.librarySectionService.setOverride(
      section.id,
      movie.id,
      "exclude",
    );
    await services.librarySectionService.clearOverride(section.id, movie.id);

    const membership = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(membership.movieTmdbIds.has(movie.tmdbId)).toBe(true);
  });
});

describe("cache invalidation", () => {
  it("reflects a changed rule on the next read, with no restart", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Comedy"],
    });

    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
      rule: horrorRule,
    });

    const before = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(before.movieTmdbIds.has(movie.tmdbId)).toBe(false);

    await services.librarySectionService.update(section.id, {
      rule: {
        type: "condition",
        field: "genres",
        op: "includesAny",
        value: ["comedy"],
      },
    });

    const after = await librarySectionRegistry.membershipFor(
      em.fork(),
      section.id,
    );

    expect(after.movieTmdbIds.has(movie.tmdbId)).toBe(true);
  });

  it("drops a disabled section from the enabled listing", async ({
    services,
    em,
  }) => {
    const section = await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
    });

    await expect(
      librarySectionRegistry.enabledSections(em.fork()),
    ).resolves.toHaveLength(1);

    await services.librarySectionService.update(section.id, {
      enabled: false,
    });

    await expect(
      librarySectionRegistry.enabledSections(em.fork()),
    ).resolves.toHaveLength(0);
  });
});

describe("media server refresh paths", () => {
  it("lists the built-in root plus every matching section", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Horror"],
    });

    await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie", "show"],
      rule: horrorRule,
    });

    await expect(
      services.librarySectionService.getVfsDirectoriesFor(movie.id),
    ).resolves.toStrictEqual(["movies", "horror/movies"]);
  });

  it("lists only the built-in root when nothing matches", async ({
    services,
    em,
    seeders,
  }) => {
    const movie = await seedMovie(em, seeders.seedCompletedMovie, {
      genres: ["Comedy"],
    });

    await services.librarySectionService.create({
      name: "Horror",
      mediaTypes: ["movie"],
      rule: horrorRule,
    });

    await expect(
      services.librarySectionService.getVfsDirectoriesFor(movie.id),
    ).resolves.toStrictEqual(["movies"]);
  });
});
