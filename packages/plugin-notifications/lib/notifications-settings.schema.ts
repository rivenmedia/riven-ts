import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

export const NotificationsSettings = z.object({
  urls: json(z.array(z.string().min(1)))
    .default([])
    .describe(
      "Notification service URLs (Apprise-style, e.g. discord://id/token, json://host/path)",
    ),
});

export type NotificationsSettings = z.infer<typeof NotificationsSettings>;
