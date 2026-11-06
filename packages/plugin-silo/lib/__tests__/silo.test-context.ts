import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import { plugin } from "../index.ts";
import { SiloSettings } from "../silo-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    createMockPluginSettings(SiloSettings, {
      siloApiKey: "sa_test-api-key",
      siloServerUrl: "http://localhost:8090",
      siloLibraryPath: "/mount",
    }),
  );
