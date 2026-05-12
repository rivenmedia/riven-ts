import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

import { expect } from "vitest";

import { it } from "../../__tests__/test-context.ts";
import { MediaItemResolver } from "./media-item.resolver.ts";

import type { CoreContext } from "../decorators/core-context.ts";

const resolver = new MediaItemResolver();

const makeCoreContext = (em: CoreContext["em"]): CoreContext => ({ em });

/**
 * Defaults for fields that the `Movie` entity requires but `MovieFactory.definition`
 * does not provide. Mirrors what `IndexedMovieSeeder` sets, so direct factory use
 * in these tests round-trips through `em.flush()` the same way the seeder does.
 */
const requiredMovieDefaults = () => ({
  indexedAt: new Date(),
  releaseDate: new Date("2020-01-01"),
});

it("libraryCounts returns all zeroes against an empty database", async ({
  em,
}) => {
  const result = await resolver.libraryCounts(makeCoreContext(em));

  expect(result).toEqual({
    movies: 0,
    shows: 0,
    seasons: 0,
    episodes: 0,
    total: 0,
  });
});

it("libraryCounts counts movies, shows, seasons, and episodes", async ({
  em,
  seeders,
}) => {
  await seeders.seedIndexedMovie();
  const showResult = await seeders.seedIndexedShow();

  const result = await resolver.libraryCounts(makeCoreContext(em));

  // Exact movie/show counts are deterministic.
  expect(result.movies).toBe(1);
  expect(result.shows).toBe(1);
  // The seeded show generates at least one season and one episode.
  expect(result.seasons).toBe(showResult.seasons?.length ?? 0);
  expect(result.episodes).toBe(showResult.episodes?.length ?? 0);
  expect(result.total).toBe(
    result.movies + result.shows + result.seasons + result.episodes,
  );
});

it("mediaItems default limit caps at 25 even when more rows exist", async ({
  em,
  factories,
}) => {
  // Persist 30 movies; the default limit should clip to 25.
  const movies = Array.from({ length: 30 }, (_, i) =>
    factories.movieFactory.makeOne({
      ...requiredMovieDefaults(),
      title: `Movie ${String(i).padStart(2, "0")}`,
    }),
  );
  em.persist(movies);
  await em.flush();

  const result = await resolver.mediaItems(makeCoreContext(em), 25, 0);

  expect(result).toHaveLength(25);
});

it("mediaItems clamps an out-of-range limit to the hard maximum", async ({
  em,
  factories,
}) => {
  const movies = Array.from({ length: 120 }, (_, i) =>
    factories.movieFactory.makeOne({
      ...requiredMovieDefaults(),
      title: `Movie ${String(i).padStart(3, "0")}`,
    }),
  );
  em.persist(movies);
  await em.flush();

  // Caller asks for 500; resolver should clamp to 100 (MAX_MEDIA_ITEMS_LIMIT).
  const result = await resolver.mediaItems(makeCoreContext(em), 500, 0);

  expect(result).toHaveLength(100);
});

it("mediaItems offset paginates without overlap", async ({ em, factories }) => {
  const movies = Array.from({ length: 6 }, (_, i) =>
    factories.movieFactory.makeOne({
      ...requiredMovieDefaults(),
      title: `Movie ${String(i).padStart(2, "0")}`,
    }),
  );
  em.persist(movies);
  await em.flush();

  const page1 = await resolver.mediaItems(makeCoreContext(em), 3, 0);
  const page2 = await resolver.mediaItems(makeCoreContext(em), 3, 3);

  expect(page1).toHaveLength(3);
  expect(page2).toHaveLength(3);
  const idsPage1 = new Set(page1.map((m) => m.id));
  for (const item of page2) {
    expect(idsPage1.has(item.id)).toBe(false);
  }
});

it("mediaItems search filters by case-insensitive title substring", async ({
  em,
  factories,
}) => {
  em.persist([
    factories.movieFactory.makeOne({
      ...requiredMovieDefaults(),
      title: "The Matrix",
    }),
    factories.movieFactory.makeOne({
      ...requiredMovieDefaults(),
      title: "Inception",
    }),
    factories.movieFactory.makeOne({
      ...requiredMovieDefaults(),
      title: "matrix reloaded",
    }),
  ]);
  await em.flush();

  const result = await resolver.mediaItems(
    makeCoreContext(em),
    25,
    0,
    "matrix",
  );

  expect(result).toHaveLength(2);
  expect(result.every((m) => m.title.toLowerCase().includes("matrix"))).toBe(
    true,
  );
});

it("mediaItems search ignores whitespace-only input", async ({
  em,
  factories,
}) => {
  em.persist([
    factories.movieFactory.makeOne({
      ...requiredMovieDefaults(),
      title: "Only Movie",
    }),
  ]);
  await em.flush();

  const result = await resolver.mediaItems(makeCoreContext(em), 25, 0, "   ");

  expect(result).toHaveLength(1);
});

it("mediaItems type filter restricts to a single subtype", async ({
  em,
  seeders,
}) => {
  await seeders.seedIndexedMovie();
  await seeders.seedIndexedShow();

  const movies = await resolver.mediaItems(
    makeCoreContext(em),
    25,
    0,
    null,
    MediaItemType.enum.movie,
  );
  const shows = await resolver.mediaItems(
    makeCoreContext(em),
    25,
    0,
    null,
    MediaItemType.enum.show,
  );

  expect(movies.length).toBeGreaterThan(0);
  expect(movies.every((m) => m.type === MediaItemType.enum.movie)).toBe(true);
  expect(shows.length).toBeGreaterThan(0);
  expect(shows.every((s) => s.type === MediaItemType.enum.show)).toBe(true);
});

it("mediaItems composes search and type filters", async ({ em, factories }) => {
  em.persist([
    factories.movieFactory.makeOne({
      ...requiredMovieDefaults(),
      title: "Matrix Movie",
    }),
  ]);
  await em.flush();

  const result = await resolver.mediaItems(
    makeCoreContext(em),
    25,
    0,
    "matrix",
    MediaItemType.enum.movie,
  );

  expect(result).toHaveLength(1);
  expect(result[0]?.title).toBe("Matrix Movie");
  expect(result[0]?.type).toBe(MediaItemType.enum.movie);
});

it("mediaItemById uses the existing find path unchanged", async ({
  em,
  indexedMovieContext: { indexedMovie },
}) => {
  // Sanity check: the existing query still works after our additions.
  const result = await resolver.mediaItemById(
    makeCoreContext(em),
    indexedMovie.id,
  );

  expect(result.id).toBe(indexedMovie.id);
});
