import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import plugin from "../index.ts";
import { SubdlSettings } from "../subdl-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    SubdlSettings.parse({ apiKey: "mock-api-key", languages: '["en", "es"]' }),
  );
