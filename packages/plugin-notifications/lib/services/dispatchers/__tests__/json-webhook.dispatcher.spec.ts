import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonWebhookDispatcher } from "../json-webhook.dispatcher.ts";

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

const mockService = { url: "https://example.com/webhook" };

describe("jsonWebhookDispatcher", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a POST to the configured URL", async () => {
    await jsonWebhookDispatcher.send(mockService, mockPayload);

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("sends the correct JSON body", async () => {
    await jsonWebhookDispatcher.send(mockService, mockPayload);

    const call = vi.mocked(fetch).mock.calls[0];
    const rawBody = call?.[1]?.body;
    const body = JSON.parse(rawBody as string) as Record<string, unknown>;

    expect(body).toMatchObject({
      event: "download.success",
      title: "Inception",
      fullTitle: "Inception (2010)",
      type: "movie",
      year: 2010,
      downloader: "realdebrid",
      provider: "torrentio",
      imdbId: "tt1375666",
      tmdbId: "27205",
    });
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    await expect(
      jsonWebhookDispatcher.send(mockService, mockPayload),
    ).rejects.toThrow("JSON webhook failed: 500 Internal Server Error");
  });
});
