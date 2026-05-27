import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import { AltmountSettings } from "../altmount-settings.schema.ts";
import plugin from "../index.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    createMockPluginSettings(AltmountSettings, {
      altmountUrl: "http://altmount.test:8081",
      altmountApiKey: "test-key",
      pollIntervalMs: 10, // fast for tests
      pollTimeoutMs: 5_000,
    }),
  );
