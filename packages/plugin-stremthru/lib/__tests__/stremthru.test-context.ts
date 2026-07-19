import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import plugin from "../index.ts";
import { StremThruSettings } from "../stremthru-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    StremThruSettings.parse({ realdebridApiKey: "test-realdebrid-api-key" }),
  );
