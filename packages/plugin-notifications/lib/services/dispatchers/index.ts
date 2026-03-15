import { discordDispatcher } from "./discord.dispatcher.ts";
import { jsonWebhookDispatcher } from "./json-webhook.dispatcher.ts";

import type { NotificationsAPI } from "../../datasource/notifications.datasource.ts";
import type { NotificationPayload } from "../notification-payload.ts";
import type { NotificationService } from "../parse-notification-url.ts";

export type { NotificationDispatcher } from "./notification-dispatcher.ts";

export async function sendNotification(
  service: NotificationService,
  payload: NotificationPayload,
  api: NotificationsAPI,
): Promise<void> {
  switch (service.type) {
    case "discord":
      return discordDispatcher.send(service, payload, api);
    case "json":
      return jsonWebhookDispatcher.send(service, payload, api);
    default: {
      const _exhaustive: never = service;
      throw new Error(
        `Unhandled notification service type: ${(_exhaustive as { type: string }).type}`,
      );
    }
  }
}
