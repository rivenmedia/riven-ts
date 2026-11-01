"use server";

import { cacheLife } from "next/cache";

import { GET_SETTINGS_SCHEMA } from "#app/(protected)/settings/_queries/get-settings-schema.query.ts";
import { getClient } from "#lib/graphql/client.ts";

export async function loadSettingsSchema() {
  "use cache";

  // The core setting schema can't change without a server
  // restart, at which point the cache will be cleared anyway.
  cacheLife("max");

  const { data } = await getClient().query({
    query: GET_SETTINGS_SCHEMA,
  });

  if (!data?.settingsSchema) {
    throw new Error("Failed to fetch settings schema");
  }

  return data.settingsSchema;
}
