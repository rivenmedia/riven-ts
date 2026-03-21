import type { JsonWebhookService } from "../../parse-notification-url.ts";
import type { NotificationDispatcher } from "../notification-dispatcher.ts";

export const jsonWebhookDispatcher: NotificationDispatcher<JsonWebhookService> =
  {
    async send({ url }, payload, api) {
      await api.postNotification(url, payload);
    },
  };
