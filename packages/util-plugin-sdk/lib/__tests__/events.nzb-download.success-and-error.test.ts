import { describe, expect, it } from "vitest";

import { MediaItemNzbDownloadErrorEvent } from "../schemas/events/media-item.nzb-download.error.event.ts";
import { MediaItemNzbDownloadSuccessEvent } from "../schemas/events/media-item.nzb-download.success.event.ts";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ---------------------------------------------------------------------------
// MediaItemNzbDownloadSuccessEvent
// ---------------------------------------------------------------------------

describe("MediaItemNzbDownloadSuccessEvent", () => {
  it("validates a well-formed event", () => {
    const event: MediaItemNzbDownloadSuccessEvent = {
      type: "riven.media-item.nzb-download.success",
      itemId: VALID_UUID,
      altmountId: "nzb-abc-123",
    };
    expect(() => MediaItemNzbDownloadSuccessEvent.parse(event)).not.toThrow();
  });

  it("rejects wrong type literal", () => {
    expect(() =>
      MediaItemNzbDownloadSuccessEvent.parse({
        type: "riven.media-item.nzb-download.error",
        itemId: VALID_UUID,
        altmountId: "nzb-abc-123",
      }),
    ).toThrow();
  });

  it("rejects missing itemId", () => {
    expect(() =>
      MediaItemNzbDownloadSuccessEvent.parse({
        type: "riven.media-item.nzb-download.success",
        altmountId: "nzb-abc-123",
      }),
    ).toThrow();
  });

  it("rejects missing altmountId", () => {
    expect(() =>
      MediaItemNzbDownloadSuccessEvent.parse({
        type: "riven.media-item.nzb-download.success",
        itemId: VALID_UUID,
      }),
    ).toThrow();
  });

  it("rejects empty altmountId", () => {
    expect(() =>
      MediaItemNzbDownloadSuccessEvent.parse({
        type: "riven.media-item.nzb-download.success",
        itemId: VALID_UUID,
        altmountId: "",
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// MediaItemNzbDownloadErrorEvent
// ---------------------------------------------------------------------------

describe("MediaItemNzbDownloadErrorEvent", () => {
  it("validates a well-formed event with detail", () => {
    const event: MediaItemNzbDownloadErrorEvent = {
      type: "riven.media-item.nzb-download.error",
      itemId: VALID_UUID,
      reason: "addurl-failed",
      detail: "download client returned 422",
    };
    expect(() => MediaItemNzbDownloadErrorEvent.parse(event)).not.toThrow();
  });

  it("validates without optional detail field", () => {
    expect(() =>
      MediaItemNzbDownloadErrorEvent.parse({
        type: "riven.media-item.nzb-download.error",
        itemId: VALID_UUID,
        reason: "poll-timeout",
      }),
    ).not.toThrow();
  });

  it.each([
    "addurl-failed",
    "poll-timeout",
    "altmount-failed",
    "incorrect-state",
  ] as const)("accepts reason value %s", (reason) => {
    expect(() =>
      MediaItemNzbDownloadErrorEvent.parse({
        type: "riven.media-item.nzb-download.error",
        itemId: VALID_UUID,
        reason,
      }),
    ).not.toThrow();
  });

  it("rejects wrong type literal", () => {
    expect(() =>
      MediaItemNzbDownloadErrorEvent.parse({
        type: "riven.media-item.nzb-download.success",
        itemId: VALID_UUID,
        reason: "addurl-failed",
      }),
    ).toThrow();
  });

  it("rejects missing itemId", () => {
    expect(() =>
      MediaItemNzbDownloadErrorEvent.parse({
        type: "riven.media-item.nzb-download.error",
        reason: "addurl-failed",
      }),
    ).toThrow();
  });

  it("rejects invalid reason value", () => {
    expect(() =>
      MediaItemNzbDownloadErrorEvent.parse({
        type: "riven.media-item.nzb-download.error",
        itemId: VALID_UUID,
        reason: "unknown-failure",
      }),
    ).toThrow();
  });
});
