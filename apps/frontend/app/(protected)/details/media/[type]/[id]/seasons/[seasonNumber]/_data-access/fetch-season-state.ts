import { io } from "next/cache";

import { query } from "#lib/graphql/client.ts";

import { GET_SEASON_STATE } from "../_queries/get-season-state.query.ts";

/**
 * Fetches the Riven state of a show's season and its episodes.
 *
 * @param tvdbId The TVDB ID of the show
 * @param seasonNumber The season number (0 for specials)
 * @returns The season's media item, or `null` if the season hasn't been indexed
 */
export async function fetchSeasonState(tvdbId: string, seasonNumber: number) {
  await io();

  const { data, error } = await query({
    query: GET_SEASON_STATE,
    variables: { tvdbId, number: seasonNumber },
  });

  if (error) {
    throw error;
  }

  const show = data?.itemRequestByExternalIds?.primaryMediaItem;

  if (show?.__typename !== "Show") {
    return null;
  }

  return show.season;
}
