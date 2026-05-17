import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  FetchChecksFailedError,
  GarbageTorrentError,
  InvalidHashError,
  RankUnderThresholdError,
  TitleSimilarityError,
} from "../exceptions.ts";

describe("GarbageTorrentError", () => {
  it("formats the error message with title and reason", () => {
    const err = new GarbageTorrentError("Test.Torrent", "bad quality");

    expect(err.message).toBe(
      'Garbage torrent detected for "Test.Torrent": bad quality',
    );
    expect(err.name).toBe("GarbageTorrentError");
  });
});

describe("TitleSimilarityError", () => {
  it("includes parsed and expected title in message", () => {
    const err = new TitleSimilarityError(
      "Test.Torrent",
      "Wrong Title",
      "Correct Title",
    );

    expect(err.message).toContain("Wrong Title");
    expect(err.message).toContain("Correct Title");
    expect(err.name).toBe("TitleSimilarityError");
    expect(err).toBeInstanceOf(GarbageTorrentError);
  });
});

describe("InvalidHashError", () => {
  it("formats with ZodError details", () => {
    const zodError = new ZodError([
      {
        code: "too_small",
        minimum: 40,
        type: "string",
        inclusive: true,
        exact: true,
        message: "String must contain exactly 40 character(s)",
        path: [],
      },
    ]);
    const err = new InvalidHashError("Test.Torrent", zodError);

    expect(err.name).toBe("InvalidHashError");
    expect(err).toBeInstanceOf(GarbageTorrentError);
    expect(err.message).toContain("Test.Torrent");
  });
});

describe("FetchChecksFailedError", () => {
  it("lists all failed reasons", () => {
    const reasons = new Set(["no_seeds", "blacklisted"]);
    const err = new FetchChecksFailedError("Test.Torrent", reasons);

    expect(err.message).toContain("no_seeds");
    expect(err.message).toContain("blacklisted");
    expect(err.name).toBe("FetchChecksFailedError");
    expect(err).toBeInstanceOf(GarbageTorrentError);
  });
});

describe("RankUnderThresholdError", () => {
  it("includes rank and threshold in message", () => {
    const err = new RankUnderThresholdError("Test.Torrent", 50, 75);

    expect(err.message).toContain("50");
    expect(err.message).toContain("75");
    expect(err.name).toBe("RankUnderThresholdError");
    expect(err).toBeInstanceOf(GarbageTorrentError);
  });
});
