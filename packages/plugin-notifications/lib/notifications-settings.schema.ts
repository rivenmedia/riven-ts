import { type } from "arktype";

const NotificationURLScheme = type.or(
  type(["'discord'", "'://'", "string > 0", "/", "string > 0"]),
  type(["'json' | 'jsons'", "'://'", "string > 0"]),
);

export const NotificationsSettings = type({
  urls: type("string.json.parse").pipe(
    type([
      NotificationURLScheme,
      "...",
      NotificationURLScheme.array(),
    ]).describe(
      "Notification service URLs (Apprise-style, e.g. discord://id/token, json://host/path)",
    ),
  ),
});

export type NotificationsSettings = typeof NotificationsSettings.infer;
