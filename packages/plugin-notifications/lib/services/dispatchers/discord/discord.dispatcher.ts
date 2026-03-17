import { buildEmbed } from "./utilities/build-embed.ts";

import type { DiscordService } from "../../parse-notification-url.ts";
import type { NotificationDispatcher } from "../notification-dispatcher.ts";
import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";

const DISCORD_WEBHOOK_BASE = "https://discord.com/api/webhooks";
export const EMBED_COLOR_SUCCESS = 0x2ecc71; // Green

export const discordDispatcher: NotificationDispatcher<DiscordService> = {
  async send({ webhookId, webhookToken }, payload, api) {
    const url = [DISCORD_WEBHOOK_BASE, webhookId, webhookToken].join("/");
    const body: RESTPostAPIWebhookWithTokenJSONBody = {
      embeds: [buildEmbed(payload)],
    };

    await api.postNotification(url, body);
  },
};
