import { BaseDataSource } from "@repo/util-plugin-sdk";

import type { NotificationsSettings } from "../notifications-settings.schema.ts";

export class NotificationsAPI extends BaseDataSource<NotificationsSettings> {
  public override baseURL = "https://notifications.internal/";
  public override serviceName = "Notifications";

  /**
   * POST a notification payload to any full URL, routed through the
   * BullMQ queue for retries, rate limiting, and persistence.
   */
  public async postNotification(fullUrl: string, body: object): Promise<void> {
    await this.post(fullUrl, { body });
  }

  public override validate() {
    return true;
  }
}
