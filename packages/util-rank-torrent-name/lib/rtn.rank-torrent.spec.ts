import { expect, it } from "vitest";

import { HASH, RELEASE, createRtn } from "./__tests__/create-rtn.ts";
import { InvalidHashError } from "./ranker/exceptions.ts";

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
