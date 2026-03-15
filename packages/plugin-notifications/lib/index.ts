import packageJson from "../package.json" with { type: "json" };
import { NotificationsAPI } from "./datasource/notifications.datasource.ts";
import { pluginConfig } from "./notifications-plugin.config.ts";
import { NotificationsSettings } from "./notifications-settings.schema.ts";
import { NotificationsSettingsResolver } from "./schema/notifications-settings.resolver.ts";
import { NotificationsResolver } from "./schema/notifications.resolver.ts";
import { sendNotification } from "./services/dispatchers/index.ts";
import { buildNotificationPayload } from "./services/notification-payload.ts";
import { parseNotificationUrl } from "./services/parse-notification-url.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [NotificationsAPI],
  resolvers: [NotificationsResolver, NotificationsSettingsResolver],
  hooks: {
    "riven.media-item.download.success": async ({
      event,
      dataSources,
      settings,
      logger,
    }) => {
      const { urls } = settings.get(NotificationsSettings);

      if (urls.length === 0) return;

      const api = dataSources.get(NotificationsAPI);
      const payload = buildNotificationPayload(event, "download.success");
      const results = await Promise.allSettled(
        urls.map(async (rawUrl) => {
          const service = parseNotificationUrl(rawUrl);
          return sendNotification(service, payload, api);
        }),
      );

      for (const [urlIndex, result] of results.entries()) {
        if (result.status === "rejected") {
          logger.error("Notification dispatch failed", {
            error: String(result.reason),
            url: urls[urlIndex],
            urlIndex,
          });
        }
      }
    },
  },
  settingsSchema: NotificationsSettings,
  validator({ settings }) {
    const { urls } = settings.get(NotificationsSettings);
    return Promise.resolve(urls.length > 0);
  },
} satisfies RivenPlugin as RivenPlugin;
