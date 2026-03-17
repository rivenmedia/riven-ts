import { fromError } from "zod-validation-error";

import { NotificationScheme } from "../schemas/notification-scheme.schema.ts";

export interface DiscordService {
  type: "discord";
  webhookId: string;
  webhookToken: string;
}

export interface JsonWebhookService {
  type: "json";
  url: string;
}

export type NotificationService = DiscordService | JsonWebhookService;

/**
 * Parses an Apprise-style notification URL into a typed service config.
 *
 * Supported schemes:
 * - `discord://webhookId/webhookToken`
 * - `json://host/path` (HTTP) or `jsons://host/path` (HTTPS)
 */
export function parseNotificationUrl(raw: string): NotificationService {
  const url = new URL(raw);

  try {
    const scheme = NotificationScheme.parse(url.protocol.replace(/:$/, ""));

    switch (scheme) {
      case "discord": {
        const [webhookToken] = url.pathname.replace(/^\//, "").split("/");
        const webhookId = url.hostname;

        if (!webhookId || !webhookToken) {
          throw new Error(
            `Invalid Discord URL: expected discord://webhookId/webhookToken`,
          );
        }

        return {
          type: "discord",
          webhookId,
          webhookToken,
        };
      }

      case "json":
      case "jsons": {
        const httpScheme = scheme === "jsons" ? "https" : "http";
        const targetUrl = new URL(raw.replace(/^jsons?:/, httpScheme + ":"));

        return {
          type: "json",
          url: targetUrl.toString(),
        };
      }
    }
  } catch (err) {
    throw fromError(err);
  }
}
