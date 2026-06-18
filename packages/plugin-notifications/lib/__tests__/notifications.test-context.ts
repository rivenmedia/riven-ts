import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import plugin from "../index.ts";
import { NotificationsSettings } from "../notifications-settings.schema.ts";

export const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    NotificationsSettings.parse({
      urls: JSON.stringify(["discord://webhook-id/webhook-token"]),
    }),
  );
