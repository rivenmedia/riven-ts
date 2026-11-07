import type { TmdbAPI, TmdbMediaType } from "../datasource/tmdb.datasource.ts";
import type { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import type { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";

/**
 * Resolves an item's genres, localising any genre IDs returned by TMDB list endpoints.
 */
export async function resolveGenres(
  api: TmdbAPI,
  mediaType: TmdbMediaType,
  { genres, genreIds }: Pick<TmdbIndexerData, "genres" | "genreIds">,
  locale: string,
): Promise<Genre[]> {
  if (genres.length > 0) {
    return genres;
  }

  if (!genreIds?.length) {
    return [];
  }

  const localisedGenres = await api.getLocalisedGenres(mediaType, locale);
  const genreIdSet = new Set(genreIds);

  return localisedGenres.filter((genre) =>
    genreIdSet.has(Math.trunc(Number(genre.id))),
  );
}
