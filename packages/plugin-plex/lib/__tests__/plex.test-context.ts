import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import plugin from "../index.ts";
import { PlexSettings } from "../plex-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    createMockPluginSettings(PlexSettings, {
      plexLibraryPath: "plex-library-path",
      plexServerUrl: "http://localhost:32400",
      plexToken: "plex-token",
    }),
  );
