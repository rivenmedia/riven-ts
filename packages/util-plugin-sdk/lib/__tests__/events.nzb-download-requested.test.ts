import { describe, expect, it } from "vitest";

import {
  MediaItemNzbDownloadRequestedEvent,
  MediaItemNzbDownloadRequestedResponse,
} from "../schemas/events/media-item.nzb-download-requested.event.ts";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const validItem = {
  id: VALID_UUID,
  title: "Inception",
  imdbId: "tt1375666",
  type: "movie",
} as const;

// ---------------------------------------------------------------------------
// MediaItemNzbDownloadRequestedEvent
// ---------------------------------------------------------------------------

describe("MediaItemNzbDownloadRequestedEvent", () => {
  it("validates a well-formed event", () => {
    const event: MediaItemNzbDownloadRequestedEvent = {
      type: "riven.media-item.nzb-download.requested",
      item: validItem,
      nzbUrl: "https://indexer.example.com/nzb/abc123",
      expectedTitle: "Inception.2010.1080p.BluRay.x264-GROUP",
    };

    expect(() => MediaItemNzbDownloadRequestedEvent.parse(event)).not.toThrow();
  });

  it("rejects wrong type literal", () => {
    expect(() =>
      MediaItemNzbDownloadRequestedEvent.parse({
        type: "riven.media-item.nzb-scrape.requested",
        item: validItem,
        nzbUrl: "https://indexer.example.com/nzb/abc123",
        expectedTitle: "Inception.2010.1080p.BluRay.x264-GROUP",
      }),
    ).toThrow();
  });

  it("rejects missing nzbUrl", () => {
    expect(() =>
      MediaItemNzbDownloadRequestedEvent.parse({
        type: "riven.media-item.nzb-download.requested",
        item: validItem,
        expectedTitle: "Inception.2010.1080p.BluRay.x264-GROUP",
      }),
    ).toThrow();
  });

  it("rejects a bad nzbUrl (not a URL)", () => {
    expect(() =>
      MediaItemNzbDownloadRequestedEvent.parse({
        type: "riven.media-item.nzb-download.requested",
        item: validItem,
        nzbUrl: "not-a-url",
        expectedTitle: "Inception.2010.1080p.BluRay.x264-GROUP",
      }),
    ).toThrow();
  });

  it("rejects empty expectedTitle", () => {
    expect(() =>
      MediaItemNzbDownloadRequestedEvent.parse({
        type: "riven.media-item.nzb-download.requested",
        item: validItem,
        nzbUrl: "https://indexer.example.com/nzb/abc123",
        expectedTitle: "",
      }),
    ).toThrow();
  });

  it("rejects an item with a malformed imdbId (missing tt prefix)", () => {
    expect(() =>
      MediaItemNzbDownloadRequestedEvent.parse({
        type: "riven.media-item.nzb-download.requested",
        item: { ...validItem, imdbId: "1375666" },
        nzbUrl: "https://indexer.example.com/nzb/abc123",
        expectedTitle: "Inception.2010.1080p.BluRay.x264-GROUP",
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// MediaItemNzbDownloadRequestedResponse
// ---------------------------------------------------------------------------

describe("MediaItemNzbDownloadRequestedResponse", () => {
  it.each(["queued", "downloading", "completed", "failed"] as const)(
    'validates status "%s"',
    (status) => {
      expect(() =>
        MediaItemNzbDownloadRequestedResponse.parse({
          altmountId: "altmount-abc-123",
          status,
        }),
      ).not.toThrow();
    },
  );

  it("rejects an empty altmountId", () => {
    expect(() =>
      MediaItemNzbDownloadRequestedResponse.parse({
        altmountId: "",
        status: "queued",
      }),
    ).toThrow();
  });

  it("rejects an unknown status value", () => {
    expect(() =>
      MediaItemNzbDownloadRequestedResponse.parse({
        altmountId: "altmount-abc-123",
        status: "pending",
      }),
    ).toThrow();
  });
});
