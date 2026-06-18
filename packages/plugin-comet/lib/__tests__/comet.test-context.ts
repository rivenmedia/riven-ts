import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import { CometSettings } from "../comet-settings.schema.ts";
import plugin from "../index.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override("settings", CometSettings.parse({}));
