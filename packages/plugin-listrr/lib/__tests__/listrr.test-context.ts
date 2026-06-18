import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import plugin from "../index.ts";
import { ListrrSettings } from "../listrr-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override("settings", ListrrSettings.parse({ apiKey: "listrr-api-key" }));
