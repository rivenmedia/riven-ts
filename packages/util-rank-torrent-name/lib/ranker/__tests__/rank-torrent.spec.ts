import { describe, expect, it } from "vitest";

import { RTN } from "../../rtn.ts";
import {
  FetchChecksFailedError,
  InvalidHashError,
  RankUnderThresholdError,
  TitleSimilarityError,
} from "../exceptions.ts";
import { createRankingModel } from "../ranking-settings.schema.ts";

import type { SettingsInput } from "../ranking-settings.schema.ts";

const HASH = "a".repeat(40);
const RELEASE = "The Matrix 1999 1080p BluRay x264";

const createRtn = (settings: SettingsInput = {}) =>
  new RTN(createRankingModel({ bluray: 100, avc: 50 }), settings);

it("ranks a torrent that passes every check", () => {
  const result = createRtn().rankTorrent(RELEASE, HASH, "The Matrix", {});

  expect(result).toMatchObject({
    hash: HASH,
    rank: 150,
    levRatio: 1,
    fetch: true,
    failedChecks: new Set(),
  });
  expect(result.data).toMatchObject({
    title: "The Matrix",
    resolution: "1080p",
  });
});

it("rejects an invalid info hash", () => {
  expect(() =>
    createRtn().rankTorrent(RELEASE, "not-a-hash", "The Matrix", {}),
  ).toThrow(InvalidHashError);
});

describe("when removing trash", () => {
  it("rejects a torrent for a different title", () => {
    expect(() =>
      createRtn().rankTorrent(
        "Inception 2010 1080p BluRay x264",
        HASH,
        "The Matrix",
        {},
      ),
    ).toThrow(
      new TitleSimilarityError(
        "Inception 2010 1080p BluRay x264",
        "Inception",
        "The Matrix",
      ),
    );
  });

  it("accepts a torrent matching an alias of the title", () => {
    const result = createRtn().rankTorrent(
      "Matrix 1999 1080p BluRay x264",
      HASH,
      "The Matrix",
      { fr: ["Matrix"] },
    );

    expect(result.levRatio).toBe(1);
  });

  it("rejects a torrent that fails the fetch checks", () => {
    expect(() =>
      createRtn({ exclude: ["x264"] }).rankTorrent(
        "The Matrix 1999 1080p CAM x264",
        HASH,
        "The Matrix",
        {},
      ),
    ).toThrow(
      new FetchChecksFailedError(
        "The Matrix 1999 1080p CAM x264",
        new Set(["trash_quality", "exclude_regex 'x264'", "cam"]),
      ),
    );
  });

  it("rejects a torrent ranked under the threshold", () => {
    expect(() =>
      createRtn({ options: { removeRanksUnder: 200 } }).rankTorrent(
        RELEASE,
        HASH,
        "The Matrix",
        {},
      ),
    ).toThrow(new RankUnderThresholdError(RELEASE, 150, 200));
  });

  it("accepts a torrent ranked exactly at the threshold", () => {
    const result = createRtn({
      options: { removeRanksUnder: 150 },
    }).rankTorrent(RELEASE, HASH, "The Matrix", {});

    expect(result.rank).toBe(150);
  });
});

describe("when keeping trash", () => {
  const settings = {
    options: { removeAllTrash: false, removeRanksUnder: 1000 },
  } satisfies SettingsInput;

  it("ranks a torrent that fails the checks and reports why", () => {
    const result = createRtn(settings).rankTorrent(
      "Inception 2010 1080p CAM x264",
      HASH,
      "The Matrix",
      {},
    );

    expect(result.fetch).toBe(false);
    // The trash checks only apply when removing trash, leaving the ranking model's checks
    expect(result.failedChecks).toStrictEqual(new Set(["cam"]));
    expect(result.levRatio).toBeLessThan(0.85);
    expect(result.rank).toBeLessThan(1000);
  });
});
