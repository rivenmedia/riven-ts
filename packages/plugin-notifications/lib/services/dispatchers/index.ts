import { parseNotificationUrl } from "../parse-notification-url.ts";
import { discordDispatcher } from "./discord/discord.dispatcher.ts";
import { jsonWebhookDispatcher } from "./json-webhook/json-webhook.dispatcher.ts";

import type { NotificationsAPI } from "../../datasource/notifications.datasource.ts";
import type { NotificationPayload } from "../../schemas/notification-payload.schema.ts";

export type { NotificationDispatcher } from "./notification-dispatcher.ts";

export function sendNotification(
  rawUrl: string,
  payload: NotificationPayload,
  api: NotificationsAPI,
): Promise<void> {
  const service = parseNotificationUrl(rawUrl);

  switch (service.type) {
    case "discord":
      return discordDispatcher.send(service, payload, api);
    case "json":
      return jsonWebhookDispatcher.send(service, payload, api);
  }
}
