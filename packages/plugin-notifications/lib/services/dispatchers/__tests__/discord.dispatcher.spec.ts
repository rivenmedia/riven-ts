import { DateTime } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { discordDispatcher } from "../discord.dispatcher.ts";

import type { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import type { NotificationPayload } from "../../notification-payload.ts";

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

describe("discordDispatcher", () => {
  const postNotification = vi.fn().mockResolvedValue(undefined);
  let mockApi: NotificationsAPI;

  beforeEach(() => {
    postNotification.mockClear();
    mockApi = { postNotification } as unknown as NotificationsAPI;
  });

  it("sends to the correct Discord webhook URL", async () => {
    await discordDispatcher.send(mockService, mockPayload, mockApi);

    expect(postNotification).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/webhook-id/webhook-token",
      expect.objectContaining({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            title: "Downloaded: Inception (2010)",
          }),
        ]),
      }),
    );
  });

  it("includes poster thumbnail in embed", async () => {
    await discordDispatcher.send(mockService, mockPayload, mockApi);

    expect(postNotification).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            thumbnail: { url: "https://image.tmdb.org/t/p/w500/poster.jpg" },
          }),
        ]),
      }),
    );
  });

  it("omits thumbnail when posterPath is null", async () => {
    const payloadWithoutPoster = { ...mockPayload, posterPath: null };
    await discordDispatcher.send(mockService, payloadWithoutPoster, mockApi);

    const call = postNotification.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const body = call[1] as { embeds: { thumbnail?: unknown }[] };

    expect(body.embeds[0]?.thumbnail).toBeUndefined();
  });
});
