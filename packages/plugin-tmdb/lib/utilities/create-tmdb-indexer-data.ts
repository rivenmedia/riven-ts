import { movieAdapter } from "../adapters/movie.adapter.ts";
import { showAdapter } from "../adapters/show.adapter.ts";

import type { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";

type DerivedFields = "tmdbId" | "tvdbId" | "type" | "isRequestable" | "adapter";

export function createTmdbMovie(
  data: Omit<TmdbIndexerData, DerivedFields>,
): TmdbIndexerData {
  return {
    ...data,
    tmdbId: data.id,
    tvdbId: null,
    type: "movie",
    isRequestable: true,
    adapter: movieAdapter,
  };
}

export function createTmdbShow(
  data: Omit<TmdbIndexerData, "id" | DerivedFields> & {
    tmdbId: string;
    tvdbId: string | null;
  },
): TmdbIndexerData {
  return {
    ...data,
    id: data.tvdbId ?? `tmdb-${data.tmdbId}`,
    type: "show",
    isRequestable: data.tvdbId !== null,
    adapter: showAdapter,
  };
}
