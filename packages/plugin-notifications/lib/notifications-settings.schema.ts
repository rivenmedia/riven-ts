import { json } from "@rivenmedia/plugin-sdk/validation";

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
  urls: json(
    z
      .array(NotificationURLScheme)
      .min(1)
      .pipe(z.tuple([NotificationURLScheme], NotificationURLScheme)),
  ).describe(
    "Notification service URLs (Apprise-style, e.g. discord://id/token, json://host/path)",
  ),
});

export type NotificationsSettings = z.infer<typeof NotificationsSettings>;
