import { describe, expect, it } from "vitest";

import {
  MediaItemNzbScrapeRequestedEvent,
  MediaItemNzbScrapeRequestedResponse,
} from "../schemas/events/media-item.nzb-scrape-requested.event.ts";

describe("MediaItemNzbScrapeRequestedEvent", () => {
  it("validates a well-formed event", () => {
    const event: MediaItemNzbScrapeRequestedEvent = {
      type: "riven.media-item.nzb-scrape.requested",
      item: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Inception",
        imdbId: "tt1375666",
        type: "movie",
      },
    };

    expect(() => MediaItemNzbScrapeRequestedEvent.parse(event)).not.toThrow();
  });

  it("rejects an event with wrong type", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedEvent.parse({
        type: "riven.media-item.scrape.requested",
        item: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          title: "Inception",
          type: "movie",
        },
      }),
    ).toThrow();
  });

  it("rejects an item with a malformed imdbId (missing tt prefix)", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedEvent.parse({
        type: "riven.media-item.nzb-scrape.requested",
        item: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          title: "Inception",
          imdbId: "1375666",
          type: "movie",
        },
      }),
    ).toThrow();
  });
});

describe("MediaItemNzbScrapeRequestedResponse", () => {
  const validCandidate = {
    url: "https://indexer.example.com/nzb/abc123",
    title: "Inception.2010.1080p.BluRay.x264-GROUP",
    size: 8_589_934_592,
    category: "Movies > HD",
    // Second-precision timestamp — what real Newznab/Torznab indexers emit.
    // If this ever fails, someone tightened publishDate precision and broke
    // compatibility with every real-world indexer.
    publishDate: "2010-07-16T14:30:00Z",
    indexer: "nzbgeek",
  };

  it("validates a response with a single candidate", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedResponse.parse({
        candidates: [validCandidate],
      }),
    ).not.toThrow();
  });

  it("accepts publishDate at second precision (HH:MM:SS)", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedResponse.parse({
        candidates: [
          { ...validCandidate, publishDate: "2010-07-16T14:30:00Z" },
        ],
      }),
    ).not.toThrow();
  });

  it("accepts publishDate at millisecond precision (HH:MM:SS.fff)", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedResponse.parse({
        candidates: [
          { ...validCandidate, publishDate: "2010-07-16T14:30:00.123Z" },
        ],
      }),
    ).not.toThrow();
  });

  // Empty candidates is intentionally valid: zero indexer results is a normal
  // pipeline outcome (handled downstream as a no-new-streams error event), not
  // a schema-level validation failure.
  it("validates a response with an empty candidates array", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedResponse.parse({ candidates: [] }),
    ).not.toThrow();
  });

  it("rejects a candidate with a malformed url", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedResponse.parse({
        candidates: [{ ...validCandidate, url: "not-a-url" }],
      }),
    ).toThrow();
  });

  it("rejects a candidate with a negative size", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedResponse.parse({
        candidates: [{ ...validCandidate, size: -1 }],
      }),
    ).toThrow();
  });

  it("rejects a candidate with a malformed publishDate", () => {
    expect(() =>
      MediaItemNzbScrapeRequestedResponse.parse({
        candidates: [{ ...validCandidate, publishDate: "not a date" }],
      }),
    ).toThrow();
  });
});
