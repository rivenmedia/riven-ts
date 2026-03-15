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
 * - `json://host/path` (HTTPS) or `jsons://host/path` (explicit HTTPS)
 */
export function parseNotificationUrl(raw: string): NotificationService {
  const url = new URL(raw);
  const scheme = url.protocol.replace(/:$/, "");

  switch (scheme) {
    case "discord": {
      const parts = url.pathname.replace(/^\//, "").split("/");
      const webhookId = url.hostname;
      const webhookToken = parts[0];

      if (!webhookId || !webhookToken) {
        throw new Error(
          `Invalid Discord URL: expected discord://webhookId/webhookToken, got ${raw}`,
        );
      }

      return { type: "discord", webhookId, webhookToken };
    }

    case "json":
    case "jsons": {
      const port = url.port ? `:${url.port}` : "";
      const targetUrl = `https://${url.hostname}${port}${url.pathname}${url.search}`;

      return { type: "json", url: targetUrl };
    }

    default:
      throw new Error(
        `Unsupported notification scheme "${scheme}". Supported: discord, json, jsons`,
      );
  }
}
