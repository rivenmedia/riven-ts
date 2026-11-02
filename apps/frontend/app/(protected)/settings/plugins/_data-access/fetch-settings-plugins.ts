import { io } from "next/cache";

import { query } from "#lib/graphql/client.ts";

import { SETTINGS_PLUGINS } from "../_queries/settings-plugins.query";

/** Loads the registered plugins and whether their enabled state is locked. */
export async function fetchSettingsPlugins() {
  await io();

  const { data, error } = await query({ query: SETTINGS_PLUGINS });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to load the plugins");
  }

  return data.settingsPlugins;
}
