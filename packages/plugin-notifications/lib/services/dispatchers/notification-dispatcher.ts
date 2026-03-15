import type { NotificationPayload } from "../notification-payload.ts";

export interface NotificationDispatcher<TService> {
  send(
    service: Omit<TService, "type">,
    payload: NotificationPayload,
  ): Promise<void>;
}
