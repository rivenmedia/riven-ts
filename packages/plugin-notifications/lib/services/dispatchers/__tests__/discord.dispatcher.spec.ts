import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { DateTime } from "luxon";
import { HttpResponse, http } from "msw";
import { describe, expect } from "vitest";

import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { pluginConfig } from "../../../notifications-plugin.config.ts";
import { discordDispatcher } from "../discord.dispatcher.ts";

import type { NotificationsSettings } from "../../../notifications-settings.schema.ts";
import type { NotificationPayload } from "../../notification-payload.ts";

const WEBHOOK_URL = "https://discord.com/api/webhooks/webhook-id/webhook-token";

const mockPayload: NotificationPayload = {
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
};

const mockService = {
  webhookId: "webhook-id",
  webhookToken: "webhook-token",
};

const testSettings = { urls: [] } satisfies NotificationsSettings;

describe("discordDispatcher", () => {
  it("sends an embed to the correct Discord webhook URL", async ({
    server,
    dataSourceConfig,
  }) => {
    let receivedBody: Record<string, unknown> | undefined;

    server.use(
      http.post(WEBHOOK_URL, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );

    const api = new NotificationsAPI({
      ...dataSourceConfig,
      pluginSymbol: pluginConfig.name,
      settings: testSettings,
    });
    await discordDispatcher.send(mockService, mockPayload, api);

    expect(receivedBody).toEqual(
      expect.objectContaining({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            title: "Downloaded: Inception (2010)",
          }),
        ]) as unknown,
      }),
    );
  });

  it("includes poster thumbnail in embed", async ({
    server,
    dataSourceConfig,
  }) => {
    let receivedBody: { embeds: { thumbnail?: { url: string } }[] } | undefined;

    server.use(
      http.post(WEBHOOK_URL, async ({ request }) => {
        receivedBody = (await request.json()) as typeof receivedBody;
        return HttpResponse.json({});
      }),
    );

    const api = new NotificationsAPI({
      ...dataSourceConfig,
      pluginSymbol: pluginConfig.name,
      settings: testSettings,
    });
    await discordDispatcher.send(mockService, mockPayload, api);

    expect(receivedBody?.embeds[0]?.thumbnail).toEqual({
      url: "https://image.tmdb.org/t/p/w500/poster.jpg",
    });
  });

  it("omits thumbnail when posterPath is null", async ({
    server,
    dataSourceConfig,
  }) => {
    let receivedBody: { embeds: { thumbnail?: unknown }[] } | undefined;

    server.use(
      http.post(WEBHOOK_URL, async ({ request }) => {
        receivedBody = (await request.json()) as typeof receivedBody;
        return HttpResponse.json({});
      }),
    );

    const api = new NotificationsAPI({
      ...dataSourceConfig,
      pluginSymbol: pluginConfig.name,
      settings: testSettings,
    });
    const payloadWithoutPoster = { ...mockPayload, posterPath: null };
    await discordDispatcher.send(mockService, payloadWithoutPoster, api);

    expect(receivedBody?.embeds[0]?.thumbnail).toBeUndefined();
  });
});
