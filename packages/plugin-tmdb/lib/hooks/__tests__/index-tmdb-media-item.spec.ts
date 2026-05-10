import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";
import { TmdbAPI } from "../../datasource/tmdb.datasource.ts";
import { indexTMDBMediaItem } from "../index-tmdb-media-item.ts";

it("returns movie details with tmdbId", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("https://api.themoviedb.org/3/movie/12345", () =>
      HttpResponse.json({
        title: "Test Movie",
        imdb_id: "tt1234567",
        genres: [
          { id: 28, name: "Action" },
          { id: 12, name: "Adventure" },
        ],
        production_countries: [{ iso_3166_1: "US" }],
        poster_path: "/poster.jpg",
        release_date: "2024-01-15",
        runtime: 120,
        original_language: "en",
      }),
    ),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: {
      item: { id: "item-1", type: "movie", tmdbId: "12345", imdbId: null },
    },
    settings: {} as any,
    logger: {} as any,
  } as any);

  expect(result).not.toBeNull();
  expect(result!.item.title).toBe("Test Movie");
  expect(result!.item.genres).toEqual(["Action", "Adventure"]);
  expect(result!.item.country).toBe("US");
  expect(result!.item.posterUrl).toContain("/poster.jpg");
  expect(result!.item.runtime).toBe(120);
});

it("resolves tmdbId from imdbId when tmdbId is missing", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.themoviedb.org/3/find/tt9876543", () =>
      HttpResponse.json({
        movie_results: [{ id: 67890 }],
        tv_results: [],
      }),
    ),
    http.get("https://api.themoviedb.org/3/movie/67890", () =>
      HttpResponse.json({
        title: "Found Movie",
        genres: [],
        runtime: 90,
        original_language: "en",
      }),
    ),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: {
      item: { id: "item-2", type: "movie", tmdbId: null, imdbId: "tt9876543" },
    },
    settings: {} as any,
    logger: {} as any,
  } as any);

  expect(result!.item.title).toBe("Found Movie");
});

it("returns null for non-movie types", async ({ dataSourceMap }) => {
  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: {
      item: { id: "item-3", type: "show", tmdbId: "12345" },
    },
    settings: {} as any,
    logger: {} as any,
  } as any);

  expect(result).toBeNull();
});

it("throws when neither tmdbId nor imdbId is present", async ({
  dataSourceMap,
}) => {
  await expect(
    indexTMDBMediaItem({
      dataSources: dataSourceMap,
      event: {
        item: { id: "item-4", type: "movie", tmdbId: null, imdbId: null },
      },
      settings: {} as any,
      logger: {} as any,
    } as any),
  ).rejects.toThrow("Media item must have either a TMDB ID or an IMDB ID");
});

it("throws when tmdbId cannot be resolved from imdbId", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.themoviedb.org/3/find/tt0000000", () =>
      HttpResponse.json({
        movie_results: [],
        tv_results: [],
      }),
    ),
  );

  await expect(
    indexTMDBMediaItem({
      dataSources: dataSourceMap,
      event: {
        item: {
          id: "item-5",
          type: "movie",
          tmdbId: null,
          imdbId: "tt0000000",
        },
      },
      settings: {} as any,
      logger: {} as any,
    } as any),
  ).rejects.toThrow("Unable to determine TMDB ID");
});
