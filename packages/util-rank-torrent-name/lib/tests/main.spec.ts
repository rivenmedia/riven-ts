/* eslint-disable vitest/no-conditional-expect */
import { beforeEach, describe, expect, it } from "vitest";

import {
  type BaseRankingModel,
  RTN,
  Resolution,
  type SettingsModel,
  type Torrent,
  createDefaultRanking,
  createDefaultSettings,
  getLevRatio,
  parse,
  sortTorrents,
  titleMatch,
} from "../index.ts";
import { normalizeTitle } from "../patterns.ts";

describe("Main Tests", () => {
  let settings: SettingsModel;
  let ranking: BaseRankingModel;

  beforeEach(() => {
    settings = createDefaultSettings();
    ranking = createDefaultRanking();
  });

  describe("titleMatch", () => {
    const testCases = [
      {
        rawTitle: "The Walking Dead",
        correctTitle: "The Walking Dead",
        expectedMatch: true,
        expectedRatio: 0.85,
      },
      {
        rawTitle: "The Walking Dead S05E03 720p HDTV x264-ASAP",
        correctTitle: "The Walking Dead",
        expectedMatch: true,
        expectedRatio: 0.85,
      },
      {
        rawTitle:
          "marvels.agents.of.s.h.i.e.l.d.s03.1080p.bluray.x264-shortbrehd[rartv]",
        correctTitle: "Marvel's Agents of S.H.I.E.L.D.",
        expectedMatch: true,
        expectedRatio: 0.85,
      },
      {
        rawTitle: "The Walking Dead",
        correctTitle: "Oppenheimer",
        expectedMatch: false,
        expectedRatio: 0,
      },
    ];

    testCases.forEach(
      ({ rawTitle, correctTitle, expectedMatch, expectedRatio }) => {
        it(`should match "${rawTitle}" against "${correctTitle}" with expected match: ${String(expectedMatch)}`, () => {
          const data = parse(rawTitle);
          const match = titleMatch(correctTitle, data.parsedTitle);
          const ratio = getLevRatio(correctTitle, data.parsedTitle);

          expect(match).toBe(expectedMatch);
          if (expectedRatio !== 0) {
            expect(ratio).toBeGreaterThanOrEqual(expectedRatio);
          } else {
            expect(ratio).toBeLessThan(0.85);
          }
        });
      },
    );
  });

  describe("normalizeTitle", () => {
    const testCases = [
      { rawTitle: "The Walking Dead", expected: "the walking dead" },
      {
        rawTitle: "Marvel's Agents of S.H.I.E.L.D.",
        expected: "marvels agents of s h i e l d",
      },
      {
        rawTitle: "The Walking Dead S05E03 720p HDTV x264-ASAP",
        expected: "the walking dead",
      },
      {
        rawTitle: "фуриоса: хроники безумного макса",
        expected: "фуриоса хроники безумного макса",
      },
      { rawTitle: "200% Wolf", expected: "200 wolf" },
    ];

    testCases.forEach(({ rawTitle, expected }) => {
      it(`should normalize "${rawTitle}" to "${expected}"`, () => {
        const data = parse(rawTitle);
        const normalized = normalizeTitle(data.parsedTitle);
        expect(normalized).toBe(expected);
      });
    });
  });

  describe("sortTorrents", () => {
    it("should sort torrents by resolution and rank", () => {
      const rtn = new RTN(settings, ranking);

      const torrents: [string, string][] = [
        [
          "Sprint.2024.S01.COMPLETE.1080p.WEBDL.h264-EDITH[TGx]",
          "1234567890123456789012345678901234567890",
        ],
        [
          "Madame Web 2024 1080p WEBRip DD 5.1 x264-GalaxyRG[TGx]",
          "1234567890123456789012345678901234567891",
        ],
        [
          "Guardians of the Galaxy Vol. 2 (2017) 720p x264 MKVTV",
          "1234567890123456789012345678901234567892",
        ],
        [
          "Wonder Woman 1984 (2020) [1440p DoVi P8 DTSHD AC3 En-AC3",
          "1234567890123456789012345678901234567893",
        ],
        [
          "8 Bit Christmas (2021) - x264 - Telugu (Fan Dub)",
          "1234567890123456789012345678901234567894",
        ],
        [
          "[SubsPlease] Fairy Tail - 100 Years Quest - 05 (1080p) [1107F3A9].mkv",
          "1234567890123456789012345678901234567895",
        ],
      ];

      const torrentObjs = new Set<Torrent>();
      for (const [torrent, hash] of torrents) {
        torrentObjs.add(rtn.rank(torrent, hash));
      }

      const sortedTorrents = sortTorrents(torrentObjs);
      const keys = Array.from(sortedTorrents.keys());

      // The order depends on resolution and rank
      // Wonder Woman 1984 has 1440p which is higher resolution
      expect(keys[0]).toBe("1234567890123456789012345678901234567893");
    });

    it("should filter torrents by resolution", () => {
      const rtn = new RTN(settings, ranking);

      const torrents: [string, string][] = [
        [
          "Sprint.2024.S01.COMPLETE.1080p.WEBDL.h264-EDITH[TGx]",
          "1234567890123456789012345678901234567890",
        ],
        [
          "Wonder Woman 1984 (2020) [1440p DoVi P8 DTSHD AC3 En-AC3",
          "1234567890123456789012345678901234567893",
        ],
      ];

      const torrentObjs = new Set<Torrent>();
      for (const [torrent, hash] of torrents) {
        torrentObjs.add(rtn.rank(torrent, hash));
      }

      const sortedTorrents = sortTorrents(torrentObjs, undefined, [
        Resolution.UHD_1440P,
      ]);
      const keys = Array.from(sortedTorrents.keys());

      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe("1234567890123456789012345678901234567893");
    });
  });

  describe("Type Check on Item", () => {
    const testCases = [
      {
        rawTitle:
          "Mad.Max.Fury.Road.2015.1080p.BluRay.DDP5.1.x265.10bit-GalaxyRG265[TGx]",
        expectedResult: "movie",
        expectedSeasons: [] as number[],
        expectedEpisodes: [] as number[],
      },
      {
        rawTitle:
          "Furiosa A Mad Max Saga (2024) [1080p] [WEBRip] [x265] [10bit] [5.1] [YTS.MX]",
        expectedResult: "movie",
        expectedSeasons: [] as number[],
        expectedEpisodes: [] as number[],
      },
      {
        rawTitle: "The Walking Dead S05E03 720p x264-ASAP",
        expectedResult: "show",
        expectedSeasons: [5],
        expectedEpisodes: [3],
      },
    ];

    testCases.forEach(
      ({ rawTitle, expectedResult, expectedSeasons, expectedEpisodes }) => {
        it(`should detect type "${expectedResult}" for "${rawTitle}"`, () => {
          const data = parse(rawTitle);
          const type =
            data.seasons.length === 0 && data.episodes.length === 0
              ? "movie"
              : "show";
          expect(type).toBe(expectedResult);
          expect(data.seasons).toEqual(expectedSeasons);
          expect(data.episodes).toEqual(expectedEpisodes);
        });
      },
    );
  });

  describe("sortTorrents with bucket limit", () => {
    it("should limit torrents per resolution bucket", () => {
      const rtn = new RTN(settings, ranking);

      const torrents: [string, string][] = [
        // Unknown resolution torrents
        ["Movie.2024.1.WEB-DL.mkv", "efe476b52c7f5504042a036bd32adf2af9327e91"],
        ["Movie.2024.2.WEB-DL.mkv", "a44e8e42dd21212c2da7a7ff5592cb365b10ee5a"],
        ["Movie.2024.3.WEB-DL.mkv", "ecb8bd9f5c3682bb08b62264cc53a8fe095946f0"],
        // 1080p torrents
        [
          "Movie.2024.4.1080p.WEB-DL.mkv",
          "bc10e7a6895ef41633cf4966e880fd7da14bff28",
        ],
        [
          "Movie.2024.5.1080p.BluRay.mkv",
          "d0eb09414bb94152b4ffbe81023894a568118dd7",
        ],
        [
          "Movie.2024.6.1080p.WEBDL.mkv",
          "611df0d2d1fd026896d013ecedeef1c1a4fc16a9",
        ],
        // 720p torrents
        [
          "Movie.2024.720p.WEB-DL.mkv",
          "e71e1f9d57e17fce640af4410a49e28bba18dd1a",
        ],
        [
          "Movie.2024.720p.BluRay.mkv",
          "d61e9402608769c6a1d02a1705a059f148b439bf",
        ],
        [
          "Movie.2024.720p.WEBDL.mkv",
          "38b640c9b942b95565fb69eb17470b1b8d0e23bc",
        ],
      ];

      const torrentObjs = new Set<Torrent>();
      for (const [torrent, hash] of torrents) {
        torrentObjs.add(rtn.rank(torrent, hash));
      }

      const sortedTorrents = sortTorrents(torrentObjs, 2);

      // Group results by resolution
      const unknownResults = [];
      const fhdResults = [];
      const hdResults = [];

      for (const [hash, torrent] of sortedTorrents.entries()) {
        if (
          !torrent.rawTitle.includes("1080p") &&
          !torrent.rawTitle.includes("720p")
        ) {
          unknownResults.push(hash);
        } else if (torrent.rawTitle.includes("1080p")) {
          fhdResults.push(hash);
        } else if (torrent.rawTitle.includes("720p")) {
          hdResults.push(hash);
        }
      }

      expect(unknownResults.length).toBe(2);
      expect(fhdResults.length).toBe(2);
      expect(hdResults.length).toBe(2);
      expect(sortedTorrents.size).toBe(6);
    });
  });
});
