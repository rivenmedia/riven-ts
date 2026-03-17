import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { DateTime } from "luxon";
import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { pluginConfig } from "../../../notifications-plugin.config.ts";
import { discordDispatcher } from "./discord.dispatcher.ts";
import { buildEmbed } from "./utilities/build-embed.ts";

import type { NotificationPayload } from "../../../schemas/notification-payload.schema.ts";
import type { DiscordService } from "../../parse-notification-url.ts";

const mockPayload = {
  event: "download.success",
  title: "Inception",
  fullTitle: "Inception (2010)",
  type: "movie",
  year: 2010,
  imdbId: "tt1375666",
  tmdbId: "27205",
  tvdbId: null,
  posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
  downloader: "realdebrid",
  provider: "torrentio",
  durationSeconds: 45,
  timestamp: DateTime.utc().toISO(),
} as const satisfies NotificationPayload;

const mockService = {
  webhookId: "webhook-id",
  webhookToken: "webhook-token",
} as const satisfies Omit<DiscordService, "type">;

it("sends an embed to the correct Discord webhook URL", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.post(
      `https://discord.com/api/webhooks/${mockService.webhookId}/${mockService.webhookToken}`,
      async ({ request }) => {
        const params = (await request.json()) as { embeds: unknown[] };
        const isExpectedPayload =
          JSON.stringify(params.embeds[0]) ===
          JSON.stringify(buildEmbed(mockPayload));

        if (!isExpectedPayload) {
          return HttpResponse.error();
        }

        return HttpResponse.json({});
      },
    ),
  );

  const api = new NotificationsAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      urls: [`discord://${mockService.webhookId}/${mockService.webhookToken}`],
    },
  });

  await expect(
    discordDispatcher.send(mockService, mockPayload, api),
  ).resolves.not.toThrow();
});
