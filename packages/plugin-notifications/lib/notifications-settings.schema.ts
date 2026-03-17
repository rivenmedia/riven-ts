import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

import { NotificationScheme } from "./schemas/notification-scheme.schema.ts";

const NotificationURLScheme = z.union([
  z.templateLiteral([
    NotificationScheme.enum.discord,
    "://",
    z.string().min(1),
    "/",
    z.string().min(1),
  ]),
  z.templateLiteral([
    NotificationScheme.extract(["json", "jsons"]),
    "://",
    z.string().min(1),
  ]),
]);

export const NotificationsSettings = z.object({
  urls: json(z.array(NotificationURLScheme))
    .default([])
    .describe(
      "Notification service URLs (Apprise-style, e.g. discord://id/token, json://host/path)",
    ),
});

export type NotificationsSettings = z.infer<typeof NotificationsSettings>;
