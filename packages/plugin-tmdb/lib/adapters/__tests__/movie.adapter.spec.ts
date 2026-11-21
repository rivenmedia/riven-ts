import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";
import { TmdbAPI } from "../../datasource/tmdb.datasource.ts";
import { createTmdbMovie } from "../../utilities/create-tmdb-indexer-data.ts";
import { movieAdapter } from "../movie.adapter.ts";

import type { MovieReleaseDates200Schema } from "../../__generated__/zod/movieReleaseDatesSchema.ts";

const TMDB_URL = "https://api.themoviedb.org/3";

const THEATRICAL = 3;
const PREMIERE = 1;

const createMovie = (imdbId?: string | null) =>
  createTmdbMovie({
    id: "603",
    ...(imdbId === undefined ? {} : { imdbId }),
    title: "The Matrix",
    overview: "",
    genres: [],
    rawRuntime: null,
    status: "unknown",
  });

const releaseDatesHandler = (results: MovieReleaseDates200Schema["results"]) =>
  http.get(`${TMDB_URL}/movie/603/release_dates`, () =>
    HttpResponse.json<MovieReleaseDates200Schema>({ id: 603, results }),
  );

it.for([
  { locale: "fr-CA", expected: "13+" },
  { locale: "en-CA", expected: "14A" },
  { locale: "de-DE", expected: "R" },
  { locale: "de", expected: "R" },
])(
  "returns the $locale certification, falling back to the US certification",
  async ({ locale, expected }, { server, dataSourceMap }) => {
    server.use(
      releaseDatesHandler([
        {
          iso_3166_1: "US",
          release_dates: [{ certification: "R", type: THEATRICAL }],
        },
        {
          iso_3166_1: "CA",
          release_dates: [
            { certification: "18A", iso_639_1: "en", type: PREMIERE },
            { certification: "14A", iso_639_1: "en", type: THEATRICAL },
            { certification: "13+", iso_639_1: "fr", type: THEATRICAL },
          ],
        },
      ]),
    );

    await expect(
      movieAdapter.getCertification(
        dataSourceMap.get(TmdbAPI),
        createMovie(),
        locale,
      ),
    ).resolves.toBe(expected);
  },
);

it("returns no certification when there is no certified theatrical, digital or physical release", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    releaseDatesHandler([
      {
        iso_3166_1: "US",
        release_dates: [
          { certification: "R", type: PREMIERE },
          { certification: "", type: THEATRICAL },
        ],
      },
    ]),
  );

  await expect(
    movieAdapter.getCertification(
      dataSourceMap.get(TmdbAPI),
      createMovie(),
      "en-US",
    ),
  ).resolves.toBeNull();
});

it("fails when the movie has no release dates", async ({
  server,
  dataSourceMap,
}) => {
  server.use(releaseDatesHandler([]));

  await expect(
    movieAdapter.getCertification(
      dataSourceMap.get(TmdbAPI),
      createMovie(),
      "en-US",
    ),
  ).rejects.toThrow("Unable to find release dates for TMDB ID 603");
});

it.for([
  {
    scenario: "neither the locale nor the US",
    results: [{ iso_3166_1: "GB" }],
  },
  {
    scenario: "the locale without dates",
    results: [{ iso_3166_1: "DE" }],
  },
])(
  "fails when $scenario has release dates",
  async ({ results }, { server, dataSourceMap }) => {
    server.use(releaseDatesHandler(results));

    await expect(
      movieAdapter.getCertification(
        dataSourceMap.get(TmdbAPI),
        createMovie(),
        "de-DE",
      ),
    ).rejects.toThrow(
      "Unable to find release dates for TMDB ID 603 in locale de-DE or fallback locale us",
    );
  },
);

it("returns the known IMDB ID without looking it up", async ({
  server,
  dataSourceMap,
}) => {
  let lookups = 0;

  server.use(
    http.get(`${TMDB_URL}/movie/603/external_ids`, () => {
      lookups += 1;

      return HttpResponse.json({ imdb_id: "tt9999999" });
    }),
  );

  await expect(
    movieAdapter.getImdbId(
      dataSourceMap.get(TmdbAPI),
      createMovie("tt0133093"),
    ),
  ).resolves.toBe("tt0133093");
  expect(lookups).toBe(0);
});

it.for([
  {
    imdbId: undefined,
    response: { imdb_id: "tt0133093" },
    expected: "tt0133093",
  },
  { imdbId: null, response: { imdb_id: "tt0133093" }, expected: "tt0133093" },
  { imdbId: undefined, response: {}, expected: null },
])(
  "looks up the IMDB ID when it is $imdbId (found: $expected)",
  async ({ imdbId, response, expected }, { server, dataSourceMap }) => {
    server.use(
      http.get(`${TMDB_URL}/movie/603/external_ids`, () =>
        HttpResponse.json(response),
      ),
    );

    await expect(
      movieAdapter.getImdbId(dataSourceMap.get(TmdbAPI), createMovie(imdbId)),
    ).resolves.toBe(expected);
  },
);
