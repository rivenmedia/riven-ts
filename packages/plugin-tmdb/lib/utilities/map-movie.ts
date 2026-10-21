import { IndexerDataStatus } from "@repo/util-plugin-sdk/dto/enums/indexer-data-status.enum";
import { DateTime, Duration } from "@repo/util-plugin-sdk/helpers/dates";

import { formatImageUrl } from "./format-image-url.ts";

import type { MovieDetails200Schema } from "../__generated__/zod/movieDetailsSchema.ts";
import type { SearchMovie200Schema } from "../__generated__/zod/searchMovieSchema.ts";
import type { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import type { ProductionCompany } from "@repo/util-plugin-sdk/dto/types/production-company.type";
import type { SpokenLanguage } from "@repo/util-plugin-sdk/dto/types/spoken-language.type";

type MovieListItem = NonNullable<SearchMovie200Schema["results"]>[number];

export const mapMovieDetails = (
  id: string,
  item: MovieDetails200Schema,
): TmdbIndexerData => ({
  id,
  genres: item.genres.map((genre) => ({
    id: genre.id.toString(),
    name: genre.name,
  })),
  overview: item.overview ?? "",
  title: item.title ?? "",
  language: item.original_language ?? null,
  posterUrl: formatImageUrl(item.poster_path, "poster"),
  releaseDate: item.release_date
    ? DateTime.fromISO(item.release_date).toJSDate()
    : null,
  backdropUrl: formatImageUrl(item.backdrop_path, "backdrop"),
  type: "movie",
  rawRuntime: item.runtime
    ? Duration.fromObject({ minutes: item.runtime })
    : null,
  status: IndexerDataStatus.parse(item.status),
  imdbId: item.imdb_id ?? null,
  budget: item.budget ?? null,
  revenue: item.revenue ?? null,
  homepage: item.homepage ?? null,
  spokenLanguages:
    item.spoken_languages?.map<SpokenLanguage>((language) => ({
      englishName: language.english_name ?? "",
      iso6391Code: language.iso_639_1 ?? "",
      name: language.name ?? "",
    })) ?? null,
  productionCompanies:
    item.production_companies?.map<ProductionCompany>((company) => ({
      id: company.id?.toString() ?? "",
      name: company.name ?? "",
      logoPath: formatImageUrl(company.logo_path, "logo") ?? null,
      originCountry: company.origin_country ?? "",
    })) ?? null,
  isRequestable: true,
  tmdbId: id,
});

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
