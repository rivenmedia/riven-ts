import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import { getMetadataStorage, Resolver } from "type-graphql";

import { plugin } from "../index.ts";
import { TvdbSettings } from "../tvdb-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override("settings", createMockPluginSettings(TvdbSettings, {}));

/**
 * The plugin extends the TmdbIndexerData object to provide season data
 * so provide a mock to prevent the isolated test environment from failing.
 */
function registerTmdbIndexerData() {
  @Resolver()
  class TmdbIndexerData {}

  getMetadataStorage().objectTypes.push({
    name: "TmdbIndexerData",
    target: TmdbIndexerData,
    interfaceClasses: [],
  });
}

it.beforeAll(() => {
  registerTmdbIndexerData();
});
