import { SUPPORTED_SCHEMES } from "../notifications-settings.schema.ts";

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
  const scheme = url.protocol.replace(/:$/, "");

  switch (scheme) {
    case "discord": {
      const [webhookToken] = url.pathname.replace(/^\//, "").split("/");
      const webhookId = url.hostname;

      if (!webhookId || !webhookToken) {
        throw new Error(
          `Invalid Discord URL: expected discord://webhookId/webhookToken, got ${raw}`,
        );
      }

      return { type: "discord", webhookId, webhookToken };
    }

    case "json":
    case "jsons": {
      const httpScheme = scheme === "jsons" ? "https" : "http";
      const targetUrl = new URL(raw.replace(/^jsons?:/, httpScheme + ":"));

      return { type: "json", url: targetUrl.toString() };
    }

    default:
      throw new Error(
        `Unsupported notification scheme "${scheme}". Supported: ${SUPPORTED_SCHEMES.join(", ")}`,
      );
  }
}
