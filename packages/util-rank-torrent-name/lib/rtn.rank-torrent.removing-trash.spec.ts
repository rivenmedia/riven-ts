import { expect, it } from "vitest";

import { HASH, RELEASE, createRtn } from "./__tests__/create-rtn.ts";
import {
  FetchChecksFailedError,
  RankUnderThresholdError,
  TitleSimilarityError,
} from "./ranker/exceptions.ts";

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
