import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { discordDispatcher } from "../discord.dispatcher.ts";

import type { NotificationPayload } from "../../notification-payload.ts";

const mockPayload: NotificationPayload = {
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
};

const mockService = {
  webhookId: "webhook-id",
  webhookToken: "webhook-token",
};

describe("discordDispatcher", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 204 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a POST to the correct Discord webhook URL", async () => {
    await discordDispatcher.send(mockService, mockPayload);

    expect(fetch).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/webhook-id/webhook-token",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("sends an embed with the correct title", async () => {
    await discordDispatcher.send(mockService, mockPayload);

    const call = vi.mocked(fetch).mock.calls[0];
    const rawBody = call?.[1]?.body;
    const body = JSON.parse(rawBody as string) as {
      embeds: { title: string }[];
    };

    expect(body.embeds[0]?.title).toBe("Downloaded: Inception (2010)");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      }),
    );

    await expect(
      discordDispatcher.send(mockService, mockPayload),
    ).rejects.toThrow("Discord webhook failed: 401 Unauthorized");
  });
});
