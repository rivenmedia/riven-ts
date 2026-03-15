import { DateTime } from "luxon";

import type { NotificationPayload } from "../notification-payload.ts";
import type { DiscordService } from "../parse-notification-url.ts";
import type { NotificationDispatcher } from "./notification-dispatcher.ts";

const DISCORD_WEBHOOK_BASE = "https://discord.com/api/webhooks";
const EMBED_COLOR_SUCCESS = 0x2ecc71; // Green

function formatDuration(seconds: number): string {
  if (seconds < 60) return String(seconds) + "s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0
    ? String(mins) + "m " + String(secs) + "s"
    : String(mins) + "m";
}

function buildEmbed(payload: NotificationPayload) {
  const fields = [
    { name: "Type", value: payload.type, inline: true },
    { name: "Downloader", value: payload.downloader, inline: true },
    {
      name: "Duration",
      value: formatDuration(payload.durationSeconds),
      inline: true,
    },
  ];

  if (payload.provider) {
    fields.push({ name: "Provider", value: payload.provider, inline: true });
  }

  if (payload.year) {
    fields.push({
      name: "Year",
      value: String(payload.year),
      inline: true,
    });
  }

  return {
    title: "Downloaded: " + payload.fullTitle,
    color: EMBED_COLOR_SUCCESS,
    fields,
    timestamp: DateTime.utc().toISO(),
    ...(payload.posterPath ? { thumbnail: { url: payload.posterPath } } : {}),
  };
}

export const discordDispatcher: NotificationDispatcher<DiscordService> = {
  async send({ webhookId, webhookToken }, payload) {
    const url = [DISCORD_WEBHOOK_BASE, webhookId, webhookToken].join("/");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [buildEmbed(payload)] }),
    });

    if (!response.ok) {
      throw new Error(
        "Discord webhook failed: " +
          String(response.status) +
          " " +
          response.statusText,
      );
    }
  },
};
