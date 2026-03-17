import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { DateTime } from "luxon";
import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { pluginConfig } from "../../../notifications-plugin.config.ts";
import { sendNotification } from "../index.ts";

import type { NotificationPayload } from "../../../schemas/notification-payload.schema.ts";

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

it('sends the expected payload to the configured HTTPS URL for the "jsons" scheme', async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.post("https://example.com/webhook", async ({ request }) => {
      const params = await request.json();
      const isExpectedPayload =
        JSON.stringify(params) === JSON.stringify(mockPayload);

      if (!isExpectedPayload) {
        return HttpResponse.error();
      }

      return HttpResponse.json({
        success: true,
      });
    }),
  );

  const api = new NotificationsAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      urls: ["jsons://example.com/webhook"],
    },
  });

  await expect(
    sendNotification("jsons://example.com/webhook", mockPayload, api),
  ).resolves.not.toThrow();
});

it('sends the expected payload to the configured HTTP URL for the "json" scheme', async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.post("http://example.com/webhook", async ({ request }) => {
      const params = await request.json();
      const isExpectedPayload =
        JSON.stringify(params) === JSON.stringify(mockPayload);

      if (!isExpectedPayload) {
        return HttpResponse.error();
      }

      return HttpResponse.json({
        success: true,
      });
    }),
  );

  const api = new NotificationsAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      urls: ["json://example.com/webhook"],
    },
  });

  await expect(
    sendNotification("json://example.com/webhook", mockPayload, api),
  ).resolves.not.toThrow();
});
