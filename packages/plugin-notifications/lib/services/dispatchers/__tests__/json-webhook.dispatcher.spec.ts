import { DateTime } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonWebhookDispatcher } from "../json-webhook.dispatcher.ts";

import type { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import type { NotificationPayload } from "../../notification-payload.ts";

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

const mockService = { url: "https://example.com/webhook" };

describe("jsonWebhookDispatcher", () => {
  const postNotification = vi.fn().mockResolvedValue(undefined);
  let mockApi: NotificationsAPI;

  beforeEach(() => {
    postNotification.mockClear();
    mockApi = { postNotification } as unknown as NotificationsAPI;
  });

  it("sends to the configured URL", async () => {
    await jsonWebhookDispatcher.send(mockService, mockPayload, mockApi);

    expect(postNotification).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({
        event: "download.success",
        title: "Inception",
        fullTitle: "Inception (2010)",
      }),
    );
  });

  it("sends the correct JSON body", async () => {
    await jsonWebhookDispatcher.send(mockService, mockPayload, mockApi);

    expect(postNotification).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
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
      }),
    );
  });
});
