import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import plugin from "../index.ts";
import { SubdlSettings } from "../subdl-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    createMockPluginSettings(SubdlSettings, {
      apiKey: "mock-api-key",
      languages: '["en", "es"]',
    }),
  );
