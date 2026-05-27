import { MediaItemNzbDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-download-requested.event";

import { describe, expect, it } from "vitest";

import { pickFirstSuccess } from "./pick-nzb-download-result.ts";

/**
 * Pure-function tests for the candidate selection logic used in the
 * nzb-download-item processor.
 *
 * These tests exercise the REAL `pickFirstSuccess` function imported from
 * the production module — not a shadow copy — so any drift in the
 * processor's selection logic surfaces immediately.
 */

function makeResult(
  overrides: Partial<MediaItemNzbDownloadRequestedResponse> = {},
): MediaItemNzbDownloadRequestedResponse {
  return MediaItemNzbDownloadRequestedResponse.parse({
    altmountId: "altmount-abc-123",
    status: "queued",
    ...overrides,
  });
}

describe("pickFirstSuccess", () => {
  it("returns undefined for an empty result list", () => {
    expect(pickFirstSuccess([])).toBeUndefined();
  });

  it("returns undefined when every result has status=failed", () => {
    const results = [
      makeResult({ altmountId: "a", status: "failed" }),
      makeResult({ altmountId: "b", status: "failed" }),
    ];

    expect(pickFirstSuccess(results)).toBeUndefined();
  });

  it("returns the single result when it has a non-failed status", () => {
    const result = makeResult({ altmountId: "ok-1", status: "queued" });

    expect(pickFirstSuccess([result])).toStrictEqual(result);
  });

  it("returns the first non-failed result when statuses are mixed", () => {
    const failed = makeResult({ altmountId: "failed-1", status: "failed" });
    const queued = makeResult({ altmountId: "queued-1", status: "queued" });
    const downloading = makeResult({
      altmountId: "dl-1",
      status: "downloading",
    });

    expect(pickFirstSuccess([failed, queued, downloading])).toStrictEqual(
      queued,
    );
  });

  it("accepts all non-failed statuses: queued, downloading, completed", () => {
    const statuses = ["queued", "downloading", "completed"] as const;

    for (const status of statuses) {
      const result = makeResult({ status });

      expect(pickFirstSuccess([result])).toStrictEqual(result);
    }
  });

  it("does not mutate the original array", () => {
    const results = [
      makeResult({ altmountId: "a", status: "queued" }),
      makeResult({ altmountId: "b", status: "queued" }),
    ];
    const originalOrder = [...results];

    pickFirstSuccess(results);

    expect(results).toStrictEqual(originalOrder);
  });

  it("aggregates correctly from multiple plugin results", () => {
    // Simulates Object.values(children) where one plugin fails and another
    // succeeds. The first non-failed plugin wins.
    const pluginA = makeResult({ altmountId: "from-a", status: "failed" });
    const pluginB = makeResult({ altmountId: "from-b", status: "queued" });

    const all = [pluginA, pluginB];

    expect(pickFirstSuccess(all)).toStrictEqual(pluginB);
  });
});
