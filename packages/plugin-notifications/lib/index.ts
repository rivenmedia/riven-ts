import packageJson from "../package.json" with { type: "json" };
import { NotificationsAPI } from "./datasource/notifications.datasource.ts";
import { pluginConfig } from "./notifications-plugin.config.ts";
import { NotificationsSettings } from "./notifications-settings.schema.ts";
import { NotificationsSettingsResolver } from "./schema/notifications-settings.resolver.ts";
import { NotificationsResolver } from "./schema/notifications.resolver.ts";
import { sendNotification } from "./services/dispatchers/send-notification.ts";
import { buildNotificationPayload } from "./services/notification-payload.ts";

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

      const api = dataSources.get(NotificationsAPI);
      const payload = buildNotificationPayload(
        event,
        "riven.media-item.download.success",
      );
      const results = await Promise.allSettled(
        urls.map(async (rawUrl) => sendNotification(rawUrl, payload, api)),
      );

      for (const [urlIndex, result] of results.entries()) {
        if (result.status === "rejected") {
          logger.error(
            `Notification dispatch failed: ${JSON.stringify({
              url: urls[urlIndex],
              urlIndex,
            })}`,
            { err: result.reason as unknown },
          );
        }
      }
    },
  },
  settingsSchema: NotificationsSettings,
  validator() {
    return Promise.resolve(true);
  },
} satisfies RivenPlugin as RivenPlugin;
