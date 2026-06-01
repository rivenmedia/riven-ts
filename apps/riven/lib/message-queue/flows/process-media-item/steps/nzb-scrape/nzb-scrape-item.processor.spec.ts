import { NzbCandidate } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";

import { describe, expect, it } from "vitest";

import {
  pickNewestCandidate,
  pickSeasonPackCandidate,
} from "./pick-nzb-candidate.ts";

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

describe("pickSeasonPackCandidate", () => {
  const pack = (title: string, publishDate = "2024-01-15T12:00:00Z") =>
    makeCandidate({ title, publishDate });

  it("returns undefined for an empty candidate list", () => {
    expect(pickSeasonPackCandidate([], 2)).toBeUndefined();
  });

  it("returns undefined when only individual episodes are present (so the season fans out to per-episode scrapes)", () => {
    const candidates = [
      pack("Breaking.Bad.S02E01.1080p.WEB-DL.x264-GRP"),
      pack("Breaking.Bad.S02E05E06.1080p.WEB-DL.x264-GRP"),
    ];

    expect(pickSeasonPackCandidate(candidates, 2)).toBeUndefined();
  });

  it("picks the season pack for the target season, never an episode", () => {
    const episode = pack("Breaking.Bad.S02E01.1080p.WEB-DL.x264-GRP");
    const seasonPack = pack(
      "Breaking.Bad.S02.1080p.NF.WEB-DL.DDP5.1.x264-PiRaTeS",
    );

    expect(pickSeasonPackCandidate([episode, seasonPack], 2)).toStrictEqual(
      seasonPack,
    );
  });

  it("ignores a season pack for a different season", () => {
    const otherSeason = pack("Breaking.Bad.S03.1080p.BluRay.x265-RARBG");

    expect(pickSeasonPackCandidate([otherSeason], 2)).toBeUndefined();
  });

  it("prefers the most specific pack (single-season over a complete-series box set)", () => {
    const boxSet = pack(
      "Breaking.Bad.S01-05.BOX-SET.NF.1080p.WEB-DL.H.264-TORK",
      "2024-02-01T00:00:00Z", // newer, but less specific
    );
    const singleSeason = pack(
      "Breaking.Bad.S02.1080p.NF.WEB-DL.DDP5.1.x264-PiRaTeS",
      "2024-01-01T00:00:00Z", // older, but exactly the target season
    );

    expect(pickSeasonPackCandidate([boxSet, singleSeason], 2)).toStrictEqual(
      singleSeason,
    );
  });

  it("picks the newest among equally-specific season packs", () => {
    const older = pack(
      "Breaking.Bad.S02.1080p.WEB-DL.x264-OLD",
      "2024-01-01T00:00:00Z",
    );
    const newer = pack(
      "Breaking.Bad.S02.2160p.WEB-DL.x265-NEW",
      "2024-03-01T00:00:00Z",
    );

    expect(pickSeasonPackCandidate([older, newer], 2)).toStrictEqual(newer);
  });

  it("matches a season pack that covers the target season among multiple seasons", () => {
    const boxSet = pack(
      "Breaking.Bad.S01-05.BOX-SET.NF.1080p.WEB-DL.H.264-TORK",
    );

    // Only a multi-season pack is available; it does cover season 2.
    expect(pickSeasonPackCandidate([boxSet], 2)).toStrictEqual(boxSet);
  });
});
