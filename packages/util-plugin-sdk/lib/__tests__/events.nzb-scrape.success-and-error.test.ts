import { describe, expect, it } from "vitest";

import { MediaItemNzbScrapeErrorEvent } from "../schemas/events/media-item.nzb-scrape.error.event.ts";
import { MediaItemNzbScrapeSuccessEvent } from "../schemas/events/media-item.nzb-scrape.success.event.ts";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ---------------------------------------------------------------------------
// MediaItemNzbScrapeSuccessEvent
// ---------------------------------------------------------------------------

describe("MediaItemNzbScrapeSuccessEvent", () => {
  it("validates a well-formed event", () => {
    const event: MediaItemNzbScrapeSuccessEvent = {
      type: "riven.media-item.nzb-scrape.success",
      itemId: VALID_UUID,
      candidateCount: 5,
    };
    expect(() => MediaItemNzbScrapeSuccessEvent.parse(event)).not.toThrow();
  });

  it("accepts zero candidateCount (valid edge case)", () => {
    expect(() =>
      MediaItemNzbScrapeSuccessEvent.parse({
        type: "riven.media-item.nzb-scrape.success",
        itemId: VALID_UUID,
        candidateCount: 0,
      }),
    ).not.toThrow();
  });

  it("rejects wrong type literal", () => {
    expect(() =>
      MediaItemNzbScrapeSuccessEvent.parse({
        type: "riven.media-item.nzb-scrape.requested",
        itemId: VALID_UUID,
        candidateCount: 5,
      }),
    ).toThrow();
  });

  it("rejects missing itemId", () => {
    expect(() =>
      MediaItemNzbScrapeSuccessEvent.parse({
        type: "riven.media-item.nzb-scrape.success",
        candidateCount: 5,
      }),
    ).toThrow();
  });

  it("rejects negative candidateCount", () => {
    expect(() =>
      MediaItemNzbScrapeSuccessEvent.parse({
        type: "riven.media-item.nzb-scrape.success",
        itemId: VALID_UUID,
        candidateCount: -1,
      }),
    ).toThrow();
  });

  it("rejects non-integer candidateCount", () => {
    expect(() =>
      MediaItemNzbScrapeSuccessEvent.parse({
        type: "riven.media-item.nzb-scrape.success",
        itemId: VALID_UUID,
        candidateCount: 1.5,
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// MediaItemNzbScrapeErrorEvent
// ---------------------------------------------------------------------------

describe("MediaItemNzbScrapeErrorEvent", () => {
  it("validates a well-formed event with detail", () => {
    const event: MediaItemNzbScrapeErrorEvent = {
      type: "riven.media-item.nzb-scrape.error",
      itemId: VALID_UUID,
      reason: "no-new-streams",
      detail: "all indexers returned 0 candidates",
    };
    expect(() => MediaItemNzbScrapeErrorEvent.parse(event)).not.toThrow();
  });

  it("validates without optional detail field", () => {
    expect(() =>
      MediaItemNzbScrapeErrorEvent.parse({
        type: "riven.media-item.nzb-scrape.error",
        itemId: VALID_UUID,
        reason: "indexer-error",
      }),
    ).not.toThrow();
  });

  it("accepts all valid reason values", () => {
    const reasons = [
      "no-new-streams",
      "indexer-error",
      "incorrect-state",
    ] as const;
    for (const reason of reasons) {
      expect(() =>
        MediaItemNzbScrapeErrorEvent.parse({
          type: "riven.media-item.nzb-scrape.error",
          itemId: VALID_UUID,
          reason,
        }),
      ).not.toThrow();
    }
  });

  it("rejects wrong type literal", () => {
    expect(() =>
      MediaItemNzbScrapeErrorEvent.parse({
        type: "riven.media-item.nzb-scrape.success",
        itemId: VALID_UUID,
        reason: "no-new-streams",
      }),
    ).toThrow();
  });

  it("rejects missing itemId", () => {
    expect(() =>
      MediaItemNzbScrapeErrorEvent.parse({
        type: "riven.media-item.nzb-scrape.error",
        reason: "no-new-streams",
      }),
    ).toThrow();
  });

  it("rejects invalid reason value", () => {
    expect(() =>
      MediaItemNzbScrapeErrorEvent.parse({
        type: "riven.media-item.nzb-scrape.error",
        itemId: VALID_UUID,
        reason: "unknown-failure",
      }),
    ).toThrow();
  });
});
