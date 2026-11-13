import { io } from "next/cache";

import { query } from "#lib/graphql/client.ts";

import { RANKING_PROFILE_SCHEMA } from "../_queries/ranking-profile-schema.query";
import { RANKING_PROFILES } from "../_queries/ranking-profiles.query";

/** Loads every ranking profile, built-in and custom. */
export async function fetchRankingProfiles() {
  await io();

  const { data, error } = await query({ query: RANKING_PROFILES });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to load the ranking profiles");
  }

  return data.rankingProfiles;
}

/** Loads the JSON Schema of the ranking profile form. */
export async function fetchRankingProfileSchema() {
  await io();

  const { data, error } = await query({ query: RANKING_PROFILE_SCHEMA });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to load the ranking profile form");
  }

  return data.rankingProfileSchema;
}
