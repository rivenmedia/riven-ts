import type { TmdbAPI, TmdbMediaType } from "../datasource/tmdb.datasource.ts";
import type { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import type { CastMember } from "@repo/util-plugin-sdk/dto/types/cast-member.type";

/**
 * Encapsulates the behaviour that differs between TMDB movies and shows,
 * so that a single resolver can serve both media types.
 */
export interface TmdbMediaAdapter {
  /**
   * The path segment used by TMDB endpoints shared by both media types.
   */
  mediaType: TmdbMediaType;

  getCertification: (
    api: TmdbAPI,
    item: TmdbIndexerData,
    locale: string,
  ) => Promise<string | null>;

  getImdbId: (api: TmdbAPI, item: TmdbIndexerData) => Promise<string | null>;

  getRecommendations: (
    api: TmdbAPI,
    item: TmdbIndexerData,
  ) => Promise<TmdbIndexerData[] | null>;

  getSimilarItems: (
    api: TmdbAPI,
    item: TmdbIndexerData,
  ) => Promise<TmdbIndexerData[] | null>;

  getCast: (
    api: TmdbAPI,
    item: TmdbIndexerData,
    language: string,
  ) => Promise<CastMember[] | null>;
}
