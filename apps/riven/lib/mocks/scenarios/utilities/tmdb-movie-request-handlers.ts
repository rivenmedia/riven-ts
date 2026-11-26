import { journeyFixtures } from "@repo/util-e2e";

import { HttpResponse, http } from "msw/http";

const { movieRequest } = journeyFixtures;

const isMovie = (id: unknown) => id === movieRequest.tmdbId.toString();

// Images with a local copy at `original` size only, in the frontend's `mocks/remote-assets`. Any other size gets the 404 placeholder.
const posterPath = "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg";
const backdropPath = "/qVGpxnjrGlHaSTCqTQI6viBDSfp.jpg";

const emptyPage = {
  page: 1,
  results: [],
  total_pages: 1,
  total_results: 0,
};

/**
 * TMDB's answers for `journeyFixtures.movieRequest`'s movie: the details Riven indexes it from, and the rest of its details page.
 *
 * Requests for any other item aren't answered.
 */
export const tmdbMovieRequestHandlers = [
  http.get("https://api.themoviedb.org/3/movie/:id", ({ params: { id } }) =>
    isMovie(id)
      ? HttpResponse.json({
          id: movieRequest.tmdbId,
          // Scrapers search by the IMDB ID, so Riven can't scrape a movie without one
          imdb_id: movieRequest.imdbId,
          title: movieRequest.title,
          original_title: movieRequest.title,
          original_language: "en",
          overview:
            "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
          // In the past, so Riven scrapes the movie rather than waiting for its release
          release_date: movieRequest.releaseDate,
          poster_path: posterPath,
          backdrop_path: backdropPath,
          genres: [
            { id: 12, name: "Adventure" },
            { id: 18, name: "Drama" },
            { id: 878, name: "Science Fiction" },
          ],
          runtime: 169,
          status: "Released",
          budget: 165_000_000,
          revenue: 701_729_206,
          production_companies: [],
          spoken_languages: [
            { english_name: "English", iso_639_1: "en", name: "English" },
          ],
        })
      : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/alternative_titles",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({ id: movieRequest.tmdbId, titles: [] })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/videos",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({ id: movieRequest.tmdbId, results: [] })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/credits",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({ id: movieRequest.tmdbId, cast: [], crew: [] })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/recommendations",
    ({ params: { id } }) =>
      isMovie(id) ? HttpResponse.json(emptyPage) : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/similar",
    ({ params: { id } }) =>
      isMovie(id) ? HttpResponse.json(emptyPage) : undefined,
  ),
] as const;
