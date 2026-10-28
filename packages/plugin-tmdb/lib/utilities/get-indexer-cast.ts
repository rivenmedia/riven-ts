import { DataSourceHTTPError } from "@repo/util-plugin-sdk";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import { episodeCreditsToCastMembers } from "./to-cast-members.ts";

import type { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import type { IndexerEpisode } from "@repo/util-plugin-sdk/dto/types/indexer-episode.type";

const notFoundStatusCodes = new Set<StatusCodes>([StatusCodes.NOT_FOUND]);

/**
 * Resolves to `null` if TMDB doesn't have the requested credits.
 */
async function nullIfNotFound<T>(request: Promise<T>) {
  try {
    return await request;
  } catch (error) {
    if (
      error instanceof DataSourceHTTPError &&
      notFoundStatusCodes.has(error.response.status)
    ) {
      return null;
    }

    throw error;
  }
}

/**
 * Retrieves the cast and guest stars of an episode.
 *
 * The episode is looked up by its TVDB ID, falling back to its show's TVDB ID
 * and season/episode numbers if TMDB doesn't have that TVDB ID.
 *
 * @returns The episode's cast, or `null` if TMDB doesn't have the episode
 */
export async function getEpisodeCast(
  api: TmdbAPI,
  episode: Pick<IndexerEpisode, "id" | "rootId" | "seasonNumber" | "number">,
  language: string,
) {
  const tmdbEpisode = await api.getEpisodeFromTvdbId(episode.id);
  const showId =
    tmdbEpisode?.show_id.toString() ??
    (await api.getShowTmdbIdFromTvdbId(episode.rootId));

  if (!showId) {
    return null;
  }

  const credits = await nullIfNotFound(
    api.getLocalisedEpisodeCredits(
      showId,
      tmdbEpisode?.season_number ?? episode.seasonNumber,
      tmdbEpisode?.episode_number ?? episode.number,
      language,
    ),
  );

  return credits && episodeCreditsToCastMembers(credits);
}
