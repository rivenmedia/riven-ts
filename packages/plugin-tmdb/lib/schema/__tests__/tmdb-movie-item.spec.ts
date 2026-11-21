import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { movieDetailsHandler } from "../../__generated__/handlers/movieDetailsHandler.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

import type { TmdbIndexerData } from "../types/tmdb-indexer-data.type.ts";

const movieItemQuery = `
  query TmdbMovieItem {
    tmdbItem(id: 603) {
      id
      title
      overview
      type
      isRequestable
      language
      posterUrl
      backdropUrl
      releaseDate
      year
      runtime
      imdbId
      genres {
        id
        name
      }
    }
  }
`;

it("looks up a movie by its TMDB ID", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    movieDetailsHandler({
      id: 603,
      title: "The Matrix",
      overview: "A hacker learns the truth about reality.",
      original_language: "en",
      poster_path: "/poster.jpg",
      backdrop_path: "/backdrop.jpg",
      release_date: "1999-03-31",
      imdb_id: "tt0133093",
      genres: [{ id: 28, name: "Action" }],
      runtime: 136,
      status: "Released",
      spoken_languages: [
        { english_name: "English", iso_639_1: "en", name: "English" },
      ],
      production_companies: [
        {
          id: 79,
          name: "Village Roadshow Pictures",
          logo_path: "/logo.png",
          origin_country: "US",
        },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: TmdbIndexerData;
  }>({ query: movieItemQuery }, { contextValue: gqlContext });

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(structuredClone(body.singleResult.data?.tmdbItem)).toStrictEqual({
    id: "603",
    title: "The Matrix",
    overview: "A hacker learns the truth about reality.",
    type: "movie",
    isRequestable: true,
    language: "en",
    posterUrl: "https://image.tmdb.org/t/p/original/poster.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/backdrop.jpg",
    // TMDB dates are parsed as midnight in the server's time zone
    releaseDate: new Date(1999, 2, 31).toISOString(),
    year: 1999,
    runtime: "136 minutes",
    imdbId: "tt0133093",
    genres: [{ id: "28", name: "Action" }],
  });
});

it("defaults the details TMDB omits", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("https://api.themoviedb.org/3/movie/603", () =>
      HttpResponse.json({ id: 603, genres: [] }),
    ),
    http.get("https://api.themoviedb.org/3/movie/603/external_ids", () =>
      HttpResponse.json({ id: 603 }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: TmdbIndexerData;
  }>({ query: movieItemQuery }, { contextValue: gqlContext });

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(structuredClone(body.singleResult.data?.tmdbItem)).toStrictEqual({
    id: "603",
    title: "",
    overview: "",
    type: "movie",
    isRequestable: true,
    language: null,
    posterUrl: null,
    backdropUrl: null,
    releaseDate: null,
    year: null,
    runtime: null,
    imdbId: null,
    genres: [],
  });
});
