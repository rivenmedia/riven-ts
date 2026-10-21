import { createTmdbMovie } from "./create-tmdb-indexer-data.ts";
import { formatImageUrl } from "./format-image-url.ts";
import { parseTmdbDate } from "./parse-tmdb-date.ts";

import type { TrendingMovies200Schema } from "../__generated__/zod/trendingMoviesSchema.ts";
import type { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";

/**
 * The movie shape returned by TMDB's list endpoints (trending, now playing, search).
 */
type MovieListItem = NonNullable<TrendingMovies200Schema["results"]>[number];

/**
 * Maps a movie from a TMDB list endpoint to {@link TmdbIndexerData}.
 *
 * @returns The mapped movie, or null if it is missing an ID or title
 */
export function movieListItemToTmdbMovie(
  movie: MovieListItem,
): TmdbIndexerData | null {
  if (!movie.id || !movie.title) {
    return null;
  }

  return createTmdbMovie({
    id: movie.id.toString(),
    title: movie.title,
    overview: movie.overview ?? "",
    backdropUrl: formatImageUrl(movie.backdrop_path, "backdrop"),
    posterUrl: formatImageUrl(movie.poster_path, "poster"),
    genres: [],
    genreIds: movie.genre_ids ?? [],
    language: movie.original_language ?? null,
    releaseDate: parseTmdbDate(movie.release_date),
    rawRuntime: null,
    status: "unknown",
  });
}
