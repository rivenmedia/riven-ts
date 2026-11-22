import { journeyFixtures } from "@repo/util-e2e";

import { HttpResponse, http } from "msw/http";

const { movie } = journeyFixtures.library;

const isMovie = (id: unknown) => id === movie.tmdbId.toString();

/**
 * TMDB's answers to the details page of `journeyFixtures.library.movie`.
 *
 * Requests for any other item aren't answered.
 */
export const tmdbDetailsHandlers = [
  http.get("https://api.themoviedb.org/3/movie/:id", ({ params: { id } }) =>
    isMovie(id)
      ? HttpResponse.json({
          id: movie.tmdbId,
          title: movie.title,
          original_language: "en",
          overview: `The overview of ${movie.title}.`,
          release_date: movie.releaseDate,
          // An image with a local copy at this size in the frontend's `mocks/remote-assets`
          poster_path: "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
          backdrop_path: "/qVGpxnjrGlHaSTCqTQI6viBDSfp.jpg",
          genres: [
            { id: 27, name: "Horror" },
            { id: 53, name: "Thriller" },
          ],
          runtime: 135,
          status: "Released",
          imdb_id: "tt1396484",
          budget: 35_000_000,
          revenue: 700_000_000,
          production_companies: [],
          spoken_languages: [
            { english_name: "English", iso_639_1: "en", name: "English" },
          ],
        })
      : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/videos",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({ id: movie.tmdbId, results: [] })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/credits",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({ id: movie.tmdbId, cast: [], crew: [] })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/recommendations",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({
            page: 1,
            results: [],
            total_pages: 1,
            total_results: 0,
          })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/similar",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({
            page: 1,
            results: [],
            total_pages: 1,
            total_results: 0,
          })
        : undefined,
  ),
] as const;
