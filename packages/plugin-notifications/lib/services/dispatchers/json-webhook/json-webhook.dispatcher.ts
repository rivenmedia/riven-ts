import type { NotificationDispatcher } from "#services/dispatchers/notification-dispatcher.ts";
import type { JsonWebhookService } from "#services/parse-notification-url.ts";

export const jsonWebhookDispatcher: NotificationDispatcher<JsonWebhookService> =
  {
    async send({ url }, payload, api) {
      await api.postNotification(url, payload);
    },
  };
