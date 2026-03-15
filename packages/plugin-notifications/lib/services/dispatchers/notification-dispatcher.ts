import type { NotificationsAPI } from "../../datasource/notifications.datasource.ts";
import type { NotificationPayload } from "../notification-payload.ts";
import type { NotificationService } from "../parse-notification-url.ts";

export interface NotificationDispatcher<T extends NotificationService> {
  send(
    service: Omit<T, "type">,
    payload: NotificationPayload,
    api: NotificationsAPI,
  ): Promise<void>;
}
