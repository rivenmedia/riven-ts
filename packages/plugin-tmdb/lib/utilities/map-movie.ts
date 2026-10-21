import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import { ShowListItem } from "../schemas/show-list-item.schema.ts";
import { formatImageUrl } from "./format-image-url.ts";

import type { SearchMulti200Schema } from "../__generated__/zod/searchMultiSchema.ts";
import type { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";

type MovieListItem = NonNullable<SearchMulti200Schema["results"]>[number];

/**
 * Map a movie from a TMDB list endpoint (search, trending, now playing).
 *
 * @returns The mapped movie, or null if it is missing required fields
 */
export const mapMovieListItem = (
  movie: MovieListItem,
): TmdbIndexerData | null => {
  if (!movie.id || !movie.title) {
    return null;
  }

  return {
    id: movie.id.toString(),
    tmdbId: movie.id.toString(),
    isRequestable: true,
    title: movie.title,
    overview: movie.overview ?? "",
    backdropUrl: formatImageUrl(movie.backdrop_path, "backdrop"),
    posterUrl: formatImageUrl(movie.poster_path, "poster"),
    genres: [],
    genreIds: movie.genre_ids ?? [],
    language: movie.original_language ?? null,
    type: "movie",
    releaseDate: movie.release_date
      ? DateTime.fromISO(movie.release_date).toJSDate()
      : null,
    rawRuntime: null,
    status: "unknown",
  };
};

/**
 * Map a show from a TMDB list endpoint (search, trending, now playing).
 *
 * @returns The mapped show, or null if it is missing required fields
 */
export const mapShowListItem = (show: unknown): TmdbIndexerData | null => {
  const parsedShow = ShowListItem.safeParse(show);

  if (!parsedShow.success) {
    return null;
  }

  const showData = parsedShow.data;

  if (!showData.id || !showData.name) {
    return null;
  }

  return {
    id: showData.id.toString(),
    tmdbId: showData.id.toString(),
    tvdbId: showData.id.toString(),
    isRequestable: true,
    title: showData.name,
    overview: showData.overview,
    backdropUrl: formatImageUrl(showData.backdrop_path, "backdrop"),
    posterUrl: formatImageUrl(showData.poster_path, "poster"),
    genres: [],
    genreIds: showData.genre_ids,
    language: showData.original_language,
    type: "show",
    releaseDate: showData.first_air_date
      ? DateTime.fromISO(showData.first_air_date).toJSDate()
      : null,
    rawRuntime: null,
    status: "unknown",
  };
};
