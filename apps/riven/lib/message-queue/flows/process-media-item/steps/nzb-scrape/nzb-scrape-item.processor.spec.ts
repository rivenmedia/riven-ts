import { NzbCandidate } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";

import { describe, expect, it } from "vitest";

import { pickNewestCandidate } from "./pick-nzb-candidate.ts";

/**
 * Pure-function tests for the candidate selection logic used in the
 * nzb-scrape-item processor.
 *
 * These tests exercise the REAL `pickNewestCandidate` function imported
 * from the production module — not a shadow copy — so any drift in the
 * processor's selection logic surfaces immediately.
 */

function makeCandidate(overrides: Partial<NzbCandidate> = {}): NzbCandidate {
  return NzbCandidate.parse({
    url: "https://indexer.example.com/nzb/12345",
    title: "Test Release 2024 1080p WEB-DL",
    size: 5_000_000_000,
    category: "2040",
    publishDate: "2024-01-15T12:00:00Z",
    indexer: "TestIndexer",
    ...overrides,
  });
}

describe("pickNewestCandidate", () => {
  it("returns undefined for an empty candidate list", () => {
    expect(pickNewestCandidate([])).toBeUndefined();
  });

  it("returns the single candidate when only one is present", () => {
    const candidate = makeCandidate();

    expect(pickNewestCandidate([candidate])).toStrictEqual(candidate);
  });

  it("returns the newest candidate when multiple are present", () => {
    const older = makeCandidate({ publishDate: "2024-01-10T00:00:00Z" });
    const newer = makeCandidate({ publishDate: "2024-01-20T00:00:00Z" });
    const oldest = makeCandidate({ publishDate: "2024-01-01T00:00:00Z" });

    expect(pickNewestCandidate([older, newer, oldest])).toStrictEqual(newer);
  });

  it("returns some candidate when all candidates share the same publishDate", () => {
    // Tie-break is undefined-by-spec in v1; we only care that *some*
    // candidate comes back when the input is non-empty.
    const a = makeCandidate({
      publishDate: "2024-01-15T12:00:00Z",
      title: "Release A",
    });
    const b = makeCandidate({
      publishDate: "2024-01-15T12:00:00Z",
      title: "Release B",
    });

    expect(pickNewestCandidate([a, b])).toBeDefined();
  });

  it("does not mutate the original array", () => {
    const candidates = [
      makeCandidate({ publishDate: "2024-01-10T00:00:00Z" }),
      makeCandidate({ publishDate: "2024-01-20T00:00:00Z" }),
    ];
    const originalOrder = [...candidates];

    pickNewestCandidate(candidates);

    expect(candidates).toStrictEqual(originalOrder);
  });

  it("aggregates correctly from multiple plugin results", () => {
    // Simulates Object.values(children).flatMap(r => r.candidates)
    const pluginA = [makeCandidate({ publishDate: "2024-01-05T00:00:00Z" })];
    const pluginB = [makeCandidate({ publishDate: "2024-01-25T00:00:00Z" })];
    const pluginC: NzbCandidate[] = [];

    const all = [pluginA, pluginB, pluginC].flatMap((r) => r);

    expect(pickNewestCandidate(all)).toStrictEqual(pluginB[0]);
  });
});
