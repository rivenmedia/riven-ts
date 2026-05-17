import { describe, expect, it } from "vitest";

import { parse } from "../parser/parse.ts";
import {
  FetchChecksFailedError,
  InvalidHashError,
  RankUnderThresholdError,
  TitleSimilarityError,
} from "./exceptions.ts";
import { rank, rankTorrent } from "./rank.ts";
import { createSettings, defaultRankingModel } from "./settings.ts";

import type { ParsedData } from "../schemas.ts";

const validHash = "a".repeat(40);

describe("rankTorrent", () => {
  it("ranks a valid torrent and returns scored result", () => {
    const settings = createSettings();
    const result = rankTorrent(
      "The.Matrix.1999.1080p.BluRay.x264-GROUP",
      validHash,
      "The Matrix",
      {},
      settings,
    );

    expect(result.hash).toBe(validHash);
    expect(result.rank).toBeGreaterThan(0);
    expect(result.data.title).toBe("The Matrix");
    expect(result.fetch).toBe(true);
    expect(result.levRatio).toBeGreaterThan(0);
  });

  it("throws InvalidHashError for invalid hash", () => {
    const settings = createSettings();

    expect(() =>
      rankTorrent(
        "Movie.2024.1080p.BluRay-GROUP",
        "badhash",
        "Movie",
        {},
        settings,
      ),
    ).toThrow(InvalidHashError);
  });

  it("throws TitleSimilarityError when titles do not match", () => {
    const settings = createSettings({
      options: { removeAllTrash: true, titleSimilarity: 0.99 },
    });

    expect(() =>
      rankTorrent(
        "Completely.Different.Title.2024.1080p-GROUP",
        validHash,
        "The Matrix",
        {},
        settings,
      ),
    ).toThrow(TitleSimilarityError);
  });

  it("throws FetchChecksFailedError when fetch checks fail with removeAllTrash", () => {
    const settings = createSettings({
      options: { removeAllTrash: true },
    });

    expect(() =>
      rankTorrent("Movie.2024.CAM-GROUP", validHash, "Movie", {}, settings),
    ).toThrow(FetchChecksFailedError);
  });

  it("throws RankUnderThresholdError when score is below threshold", () => {
    const settings = createSettings({
      options: { removeAllTrash: true, removeRanksUnder: 999999 },
    });

    expect(() =>
      rankTorrent(
        "Movie.2024.1080p.WEB-DL.x264-GROUP",
        validHash,
        "Movie",
        {},
        settings,
      ),
    ).toThrow(RankUnderThresholdError);
  });

  it("does not throw when removeAllTrash is false even with bad quality", () => {
    const settings = createSettings({
      options: { removeAllTrash: false },
    });

    const result = rankTorrent(
      "Movie.2024.CAM-GROUP",
      validHash,
      "Movie",
      {},
      settings,
    );

    expect(result.fetch).toBe(false);
  });

  it("adds bonus when preferred pattern matches the raw title", () => {
    const settings = createSettings({
      preferred: ["1080p"],
    });

    const result = rankTorrent(
      "Movie.2024.1080p.BluRay.x264-GROUP",
      validHash,
      "Movie",
      {},
      settings,
    );

    expect(result.rank).toBeGreaterThanOrEqual(10000);
  });

  it("adds preferred language bonus when a language matches", () => {
    const settings = createSettings({
      languages: { preferred: ["english"] },
    });

    const data = {
      ...parse("Movie.2024.1080p.BluRay.x264-GROUP"),
      languages: ["english"],
    };

    const result = rank(data, settings, defaultRankingModel);

    expect(result.scoreParts["preferredLanguages"]).toBe(10000);
  });
});

describe("rank", () => {
  it("throws when rawTitle is empty", () => {
    const settings = createSettings();
    const data: ParsedData = {
      ...parse("Movie.2024"),
      rawTitle: "",
    };

    expect(() => rank(data, settings, defaultRankingModel)).toThrow(
      "Parsed data cannot have an empty rawTitle.",
    );
  });

  it("scores bitDepth when present in parsed data", () => {
    const settings = createSettings();
    const data: ParsedData = {
      ...parse("Movie.2024.1080p.10bit.BluRay.x264-GROUP"),
      bitDepth: 10,
    };

    const result = rank(data, settings, defaultRankingModel);

    expect(result.scoreParts["bitDepth"]).toBeDefined();
  });
});
