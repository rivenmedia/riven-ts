import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import plugin from "../index.ts";
import { SeerrSettings } from "../seerr-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override("settings", SeerrSettings.parse({ apiKey: "seerr-api-key" }));
