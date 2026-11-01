"use cache";

import { cacheLife } from "next/cache";

import { query } from "#lib/graphql/client.ts";

import { GET_SEASON } from "../_queries/get-season.query.ts";

/**
 * Fetches a show and one of its seasons, including the season's episodes.
 *
 * @param id The TVDB ID of the show
 * @param seasonNumber The season number (0 for specials)
 */
export async function fetchSeason(id: string, seasonNumber: number) {
  // Episode details are filled in as a season airs, so this is cached for less time than the show's season list
  cacheLife("hours");

  const { data, error } = await query({
    query: GET_SEASON,
    variables: { id, seasonNumber },
  });

  if (error) {
    throw error;
  }

  return data?.tmdbItem ?? null;
}
