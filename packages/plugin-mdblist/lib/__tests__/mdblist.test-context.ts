import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import plugin from "../index.ts";
import { MdbListSettings } from "../mdblist-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override("settings", MdbListSettings.parse({ apiKey: "mock-api-key" }));
