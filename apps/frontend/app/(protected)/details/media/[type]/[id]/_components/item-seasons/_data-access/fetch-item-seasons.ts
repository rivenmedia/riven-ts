"use cache";

import { cacheLife } from "next/cache";

import { query } from "#lib/graphql/client.ts";

import { GET_ITEM_SEASONS } from "../_queries/get-item-seasons.query";

export async function fetchItemSeasons(id: string) {
  cacheLife("days");

  const { data, error } = await query({
    query: GET_ITEM_SEASONS,
    variables: { id },
  });

  if (error) {
    throw error;
  }

  return data?.tmdbItem.seasons ?? null;
}
