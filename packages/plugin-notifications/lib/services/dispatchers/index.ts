import { discordDispatcher } from "./discord.dispatcher.ts";
import { jsonWebhookDispatcher } from "./json-webhook.dispatcher.ts";

import type { NotificationPayload } from "../notification-payload.ts";
import type { NotificationService } from "../parse-notification-url.ts";

export type { NotificationDispatcher } from "./notification-dispatcher.ts";

export async function sendNotification(
  service: NotificationService,
  payload: NotificationPayload,
): Promise<void> {
  switch (service.type) {
    case "discord":
      return discordDispatcher.send(service, payload);
    case "json":
      return jsonWebhookDispatcher.send(service, payload);
  }
}
