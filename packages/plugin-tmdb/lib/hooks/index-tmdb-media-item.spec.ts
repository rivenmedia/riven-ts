import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { UnrecoverableError } from "@repo/util-plugin-sdk/errors/unrecoverable-error";

import { HttpResponse, http } from "msw/http";
import { randomUUID } from "node:crypto";
import { expect } from "vitest";

import { findByIdHandler } from "../__generated__/handlers/findByIdHandler.ts";
import { movieAlternativeTitlesHandler } from "../__generated__/handlers/movieAlternativeTitlesHandler.ts";
import { movieDetailsHandler } from "../__generated__/handlers/movieDetailsHandler.ts";
import { it as baseIt } from "../__tests__/tmdb.test-context.ts";
import { indexTMDBMediaItem } from "./index-tmdb-media-item.ts";

const it = baseIt.extend("item", ({}) => {
  const item = new ItemRequest();

  item.id = randomUUID();
  item.type = "movie";
  item.tmdbId = "603";

  return item;
});

it.beforeEach(({ server }) => {
  server.use(
    movieDetailsHandler({
      id: 603,
      title: "The Matrix",
      genres: [],
    }),
  );
});

it("maps the alternative titles to aliases keyed by country", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieAlternativeTitlesHandler({
      id: 603,
      titles: [
        { iso_3166_1: "US", title: "Matrix", type: "" },
        { iso_3166_1: "US", title: "The Matrix 1", type: "" },
        { iso_3166_1: "FR", title: "Matrix", type: "" },
      ],
    }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item.aliases).toStrictEqual({
    us: ["matrix", "the matrix 1"],
    fr: ["matrix"],
  });
});

it("ignores alternative titles that are identical to the main title", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieAlternativeTitlesHandler({
      id: 603,
      titles: [{ iso_3166_1: "GB", title: "The Matrix", type: "" }],
    }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item.aliases).toStrictEqual({});
});

it("ignores alternative titles without a title or country", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieAlternativeTitlesHandler({
      id: 603,
      titles: [
        { iso_3166_1: "US", title: "", type: "" },
        { iso_3166_1: "", title: "Matrix", type: "" },
        { title: "Matrix", type: "" },
      ],
    }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item.aliases).toStrictEqual({});
});

it("deduplicates alternative titles case-insensitively", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieAlternativeTitlesHandler({
      id: 603,
      titles: [
        { iso_3166_1: "US", title: "Matrix", type: "" },
        { iso_3166_1: "us", title: "MATRIX", type: "" },
      ],
    }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item.aliases).toStrictEqual({
    us: ["matrix"],
  });
});

it("ignores items that are not movies", async ({
  item,
  dataSourceMap,
  settings,
  logger,
}) => {
  item.type = "show";

  await expect(
    indexTMDBMediaItem({
      dataSources: dataSourceMap,
      event: { item },
      logger,
      settings,
    }),
  ).resolves.toBeNull();
});

it("fails when the item has neither a TMDB ID nor an IMDB ID", async ({
  item,
  dataSourceMap,
  settings,
  logger,
}) => {
  item.tmdbId = null;
  item.imdbId = null;

  await expect(
    indexTMDBMediaItem({
      dataSources: dataSourceMap,
      event: { item },
      logger,
      settings,
    }),
  ).rejects.toThrow(
    new UnrecoverableError(
      "Media item must have either a TMDB ID or an IMDB ID",
    ),
  );
});

it("resolves the TMDB ID from the IMDB ID", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  item.tmdbId = null;
  item.imdbId = "tt0133093";

  server.use(
    findByIdHandler(({ request, params }) => {
      const source = new URL(request.url).searchParams.get("external_source");

      if (params["external_id"] !== "tt0133093" || source !== "imdb_id") {
        return HttpResponse.json({ movie_results: [] });
      }

      return HttpResponse.json({ movie_results: [{ id: 603 }] });
    }),
    movieAlternativeTitlesHandler({ id: 603, titles: [] }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item).toMatchObject({
    title: "The Matrix",
    imdbId: "tt0133093",
  });
});

it.for([
  { scenario: "is not a movie", response: () => HttpResponse.json({}) },
  {
    scenario: "cannot be looked up",
    response: () => HttpResponse.json(null, { status: 500 }),
  },
])(
  "fails when the IMDB ID $scenario",
  async ({ response }, { item, dataSourceMap, settings, server, logger }) => {
    item.tmdbId = null;
    item.imdbId = "tt0944947";

    server.use(findByIdHandler(response));

    await expect(
      indexTMDBMediaItem({
        dataSources: dataSourceMap,
        event: { item },
        logger,
        settings,
      }),
    ).rejects.toThrow(
      new UnrecoverableError(
        `Unable to determine TMDB ID for media item ${item.id}`,
      ),
    );
  },
);

it("maps the movie details to the indexed item", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieDetailsHandler({
      id: 603,
      title: "The Matrix",
      imdb_id: "tt0133093",
      genres: [
        { id: 28, name: "Action" },
        { id: 0, name: "" },
        { id: 878, name: "Science Fiction" },
      ],
      production_countries: [{ iso_3166_1: "US" }, { iso_3166_1: "AU" }],
      poster_path: "/poster.jpg",
      release_date: "1999-03-31",
      runtime: 136,
      original_language: "en",
    }),
    movieAlternativeTitlesHandler({ id: 603, titles: [] }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result).toStrictEqual({
    item: {
      id: item.id,
      type: "movie",
      imdbId: "tt0133093",
      genres: ["Action", "Science Fiction"],
      title: "The Matrix",
      aliases: {},
      country: "US",
      rating: 0,
      contentRating: "unknown",
      posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
      releaseDate: "1999-03-31T00:00Z",
      runtime: 136,
      language: "en",
    },
  });
});

it("prefers the item's IMDB ID and defaults missing movie details", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  item.imdbId = "tt0000001";

  server.use(
    http.get("https://api.themoviedb.org/3/movie/603", () =>
      HttpResponse.json({ id: 603, imdb_id: "tt0133093", genres: [] }),
    ),
    movieAlternativeTitlesHandler({ id: 603 }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item).toMatchObject({
    imdbId: "tt0000001",
    title: "Unknown title",
    aliases: {},
    country: undefined,
    posterUrl: null,
    releaseDate: null,
    language: null,
  });
});
