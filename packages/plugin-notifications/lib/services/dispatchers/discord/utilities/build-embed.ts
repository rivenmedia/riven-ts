import { Duration } from "luxon";

import type { NotificationPayload } from "../../../../schemas/notification-payload.schema.ts";
import type { APIEmbed } from "discord-api-types/v10";

export const EMBED_COLOR_SUCCESS = 0x2ecc71; // Green

export function buildEmbed(payload: NotificationPayload): APIEmbed {
  const fields: APIEmbed["fields"] = [
    { name: "Type", value: payload.type, inline: true },
    { name: "Downloader", value: payload.downloader, inline: true },
    {
      name: "Duration",
      value: Duration.fromObject({ seconds: payload.durationSeconds })
        .rescale()
        .toHuman({ unitDisplay: "narrow" }),
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
    title: `Downloaded: ${payload.fullTitle}`,
    color: EMBED_COLOR_SUCCESS,
    fields,
    timestamp: payload.timestamp,
    ...(payload.posterPath ? { thumbnail: { url: payload.posterPath } } : {}),
  };
}
