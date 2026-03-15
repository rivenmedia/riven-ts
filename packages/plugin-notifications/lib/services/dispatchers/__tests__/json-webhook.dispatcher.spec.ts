import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { DateTime } from "luxon";
import { HttpResponse, http } from "msw";
import { describe, expect } from "vitest";

import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { pluginConfig } from "../../../notifications-plugin.config.ts";
import { jsonWebhookDispatcher } from "../json-webhook.dispatcher.ts";

import type { NotificationsSettings } from "../../../notifications-settings.schema.ts";
import type { NotificationPayload } from "../../notification-payload.ts";

const WEBHOOK_URL = "https://example.com/webhook";

const timestamp = DateTime.utc().toISO();

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
  timestamp,
};

const mockService = { url: WEBHOOK_URL };

const testSettings = { urls: [] } satisfies NotificationsSettings;

describe("jsonWebhookDispatcher", () => {
  it("sends the full payload to the configured URL", async ({
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
    await jsonWebhookDispatcher.send(mockService, mockPayload, api);

    expect(receivedBody).toEqual({
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
      timestamp,
    });
  });
});
