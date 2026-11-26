import { expect, it } from "vitest";

import { createRankingModel } from "./ranker/ranking-settings.schema.ts";
import { RTN } from "./rtn.ts";

const rtn = new RTN(createRankingModel({ bluray: 100, remux: 1000, web: 10 }), {
  options: { removeAllTrash: false },
});

const rankTorrents = (releases: string[]) =>
  releases.map((release, index) =>
    rtn.rankTorrent(release, index.toString(16).padStart(40, "0"), "Movie", {}),
  );

it("keeps the highest ranked torrents of each resolution up to the bucket limit", () => {
  const torrents = rankTorrents([
    "Movie 2020 1080p WEB x264",
    "Movie 2020 1080p BluRay REMUX AVC",
    "Movie 2020 720p WEB x264",
    "Movie 2020 1080p BluRay x264",
    "Movie 2020 720p BluRay x264",
  ]);

  const sorted = rtn.sortTorrents(torrents, 2, new Set(["1080p", "720p"]));

  expect(sorted.map(({ data }) => data.rawTitle)).toStrictEqual([
    "Movie 2020 1080p BluRay REMUX AVC",
    "Movie 2020 1080p BluRay x264",
    "Movie 2020 720p BluRay x264",
    "Movie 2020 720p WEB x264",
  ]);
});

it("keeps torrents of every resolution when no resolutions are given", () => {
  const torrents = rankTorrents([
    "Movie 2020 720p WEB x264",
    "Movie 2020 2160p BluRay x264",
  ]);

  const sorted = rtn.sortTorrents(torrents, Infinity, new Set());

  expect(sorted.map(({ data }) => data.rawTitle)).toStrictEqual([
    "Movie 2020 2160p BluRay x264",
    "Movie 2020 720p WEB x264",
  ]);
});
