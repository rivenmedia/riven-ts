import { BaseDataSource } from "@repo/util-plugin-sdk";

import type { NotificationsSettings } from "../notifications-settings.schema.ts";

export class NotificationsAPI extends BaseDataSource<NotificationsSettings> {
  override baseURL = "https://notifications.internal/";
  override serviceName = "Notifications";

  /**
   * POST a notification payload to any full URL, routed through the
   * BullMQ queue for retries, rate limiting, and persistence.
   */
  async postNotification(fullUrl: string, body: object): Promise<void> {
    await this.post(fullUrl, { body });
  }

  override validate() {
    return true;
  }
}
