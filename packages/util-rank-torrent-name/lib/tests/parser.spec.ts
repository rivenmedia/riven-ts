/* eslint-disable vitest/no-conditional-expect */
import { describe, expect, it } from "vitest";

import {
  episodesFromSeason,
  extractEpisodes,
  getLevRatio,
  getParsedDataType,
  parse,
  titleMatch,
} from "../index.ts";

describe("Parser Tests", () => {
  describe("ParsedData model", () => {
    it("should parse torrent title with all expected fields", () => {
      const testString =
        "The Simpsons S01E01E02 1080p BluRay x265 HEVC 10bit AAC 5.1 Tigole";
      const data = parse(testString);

      expect(data.rawTitle).toBe(testString);
      expect(data.parsedTitle).toBe("The Simpsons");
      expect(data.resolution).toBe("1080p");
      expect(data.quality).toBe("BluRay");
      expect(data.seasons).toEqual([1]);
      // Note: parse-torrent-title may only extract single episodes
      expect(data.episodes.length).toBeGreaterThan(0);
      expect(data.codec?.toLowerCase()).toContain("hevc");
      expect(data.audio).toContain("AAC");
    });
  });

  describe("title_match", () => {
    const testCases = [
      { title: "Damsel", query: "Damsel (2024)", expected: false },
      { title: "The Simpsons", query: "The Simpsons", expected: true },
      { title: "The Simpsons", query: "The Simpsons Movie", expected: false },
      { title: "The Simpsons", query: "The Simpsons S01E01", expected: false },
      {
        title: "The Simpsons S01E01",
        query: "The Simpsons S01E01",
        expected: true,
      },
      {
        title: "The Simpsons Movie",
        query: "The Simpsons Movie",
        expected: true,
      },
      {
        title: "American Horror Story",
        query: "American Story Horror",
        expected: false,
      },
      { title: "S W A T", query: "S.W.A.T.", expected: true },
    ];

    testCases.forEach(({ title, query, expected }) => {
      it(`titleMatch("${title}", "${query}") should return ${String(expected)}`, () => {
        expect(titleMatch(title, query)).toBe(expected);
      });
    });
  });

  describe("getLevRatio", () => {
    const testCases = [
      { title: "Damsel", query: "Damsel (2024)", expected: 0 },
      { title: "The Simpsons", query: "The Simpsons", expected: 1 },
      { title: "The Simpsons", query: "The Simpsons Movie", expected: 0 },
      { title: "The Simpsons", query: "The Simpsons S01E01", expected: 0 },
      {
        title: "The Simpsons S01E01",
        query: "The Simpsons S01E01",
        expected: 1,
      },
      { title: "The Simpsons Movie", query: "The Simpsons Movie", expected: 1 },
      {
        title: "American Horror Story",
        query: "American Story Horror",
        expected: 0,
      },
      { title: "S W A T", query: "S.W.A.T.", expected: 1 },
    ];

    testCases.forEach(({ title, query, expected }) => {
      it(`getLevRatio("${title}", "${query}") should be ${expected === 1 ? ">= 0.85" : "< 0.85"}`, () => {
        const ratio = getLevRatio(title, query);

        if (expected === 1) {
          expect(ratio).toBeGreaterThanOrEqual(0.85);
        } else {
          expect(ratio).toBeLessThan(0.85);
        }
      });
    });
  });

  describe("title_match with aliases", () => {
    const testCases = [
      {
        correctTitle: "The Way of the Househusband",
        parsedTitle: "The Way of the House Husband",
        aliases: {
          jp: ["Gokushufudō", "Gokushufudou"],
          us: ["The Way of the Househusband", "The Way of the House Husband"],
          cn: ["极道主夫"],
        },
        expected: 1,
      },
      {
        correctTitle: "The Way of the Househusband",
        parsedTitle: "极道主夫",
        aliases: {
          jp: ["Gokushufudō", "Gokushufudou"],
          us: ["The Way of the Househusband", "The Way of the House Husband"],
          cn: ["极道主夫"],
        },
        expected: 1,
      },
      {
        correctTitle: "The Simpsons",
        parsedTitle: "The Simpsons",
        aliases: {},
        expected: 1,
      },
    ];

    testCases.forEach(({ correctTitle, parsedTitle, aliases, expected }) => {
      it(`getLevRatio with aliases for "${parsedTitle}"`, () => {
        const ratio = getLevRatio(correctTitle, parsedTitle, 0.85, aliases);

        if (expected === 1) {
          expect(ratio).toBeGreaterThanOrEqual(0.85);
        } else {
          expect(ratio).toBeLessThan(0.85);
        }
      });
    });
  });

  describe("title_match exceptions", () => {
    it("should throw for invalid title type", () => {
      expect(() =>
        titleMatch("The Simpsons", 12345 as unknown as string),
      ).toThrow();
    });

    it("should not throw for valid threshold", () => {
      expect(() =>
        titleMatch("The Simpsons", "The Simpsons", 0.9),
      ).not.toThrow();
    });

    it("should throw for invalid threshold", () => {
      expect(() => titleMatch("The Simpsons", "The Simpsons", 1.1)).toThrow();
    });

    it("should throw for null titles", () => {
      expect(() =>
        titleMatch(null as unknown as string, null as unknown as string),
      ).toThrow();
    });
  });

  describe("Media type detection", () => {
    const showCases = [
      "The Simpsons S01E01 1080p BluRay x265 HEVC 10bit AAC 5.1 Tigole",
      "The Simpsons S01E01E02 1080p BluRay x265 HEVC 10bit AAC 5.1 Tigole",
      "The Simpsons S01E01-E02 1080p BluRay x265 HEVC 10bit AAC 5.1 Tigole",
      "House MD All Seasons (1-8) 720p Ultra-Compressed",
      "Lost.[Perdidos].6x05.HDTV.XviD.[www.DivxTotaL.com]",
      "BoJack Horseman [06x01-08 of 16] (2019-2020) WEB-DLRip 720p",
    ];

    const movieCases = [
      "Dragon Ball Z Movie - 09 - Bojack Unbound - 1080p BluRay x264 DTS 5.1 -DDR",
      "Joker.2019.PROPER.mHD.10Bits.1080p.BluRay.DD5.1.x265-TMd.mkv",
      "Hercules.2014.EXTENDED.1080p.WEB-DL.DD5.1.H264-RARBG",
      "Brave.2012.R5.DVDRip.XViD.LiNE-UNiQUE",
      "Guardians of the Galaxy (2014) Dual Audio DVDRip AVI",
      "Hercules",
    ];

    showCases.forEach((title) => {
      it(`should detect "${title.substring(0, 40)}..." as show`, () => {
        const data = parse(title);
        expect(getParsedDataType(data)).toBe("show");
      });
    });

    movieCases.forEach((title) => {
      it(`should detect "${title.substring(0, 40)}..." as movie`, () => {
        const data = parse(title);
        expect(getParsedDataType(data)).toBe("movie");
      });
    });
  });

  describe("Season/Episode extraction", () => {
    const testCases = [
      {
        title: "3.10.to.Yuma.2007.1080p.BluRay.x264.DTS-SWTYBLZ.mkv",
        expectedSeason: [],
        expectedEpisode: [],
      },
      {
        title: "30.Minutes.or.Less.2011.1080p.BluRay.X264-SECTOR7.mkv",
        expectedSeason: [],
        expectedEpisode: [],
      },
      {
        title:
          "The Steve Harvey Show - S02E07 - When the Funk Hits the Rib Tips.mkv",
        expectedSeason: [2],
        expectedEpisode: [7],
      },
      {
        title:
          "The Simpsons S01E01 1080p BluRay x265 HEVC 10bit AAC 5.1 Tigole",
        expectedSeason: [1],
        expectedEpisode: [1],
      },
      {
        title: "The Avengers (EMH) - S01 E15 - 459 (1080p - BluRay)",
        expectedSeason: [1],
        expectedEpisode: [15],
      },
      {
        title: "Lost.[Perdidos].6x05.HDTV.XviD.[www.DivxTotaL.com]",
        expectedSeason: [6],
        expectedEpisode: [5],
      },
      {
        title: "The Joker (2019) 1080p WEB-DL x264 - YIFY",
        expectedSeason: [],
        expectedEpisode: [],
      },
    ];

    testCases.forEach(({ title, expectedSeason, expectedEpisode }) => {
      it(`should extract S${expectedSeason.toString()} E${expectedEpisode.toString()} from "${title.substring(0, 40)}..."`, () => {
        const data = parse(title);
        expect(data.seasons).toEqual(expectedSeason);
        expect(data.episodes).toEqual(expectedEpisode);
      });
    });
  });

  describe("episodesFromSeason", () => {
    it("should throw for empty title", () => {
      expect(() => episodesFromSeason("", 1)).toThrow();
    });

    it("should throw for invalid season number", () => {
      expect(() =>
        episodesFromSeason("The Simpsons S01E01", "rice" as unknown as number),
      ).toThrow();
    });

    it("should throw for null season number", () => {
      expect(() =>
        episodesFromSeason("The Simpsons S01E01", null as unknown as number),
      ).toThrow();
    });

    it("should return episodes for matching season", () => {
      const episodes = episodesFromSeason(
        "The Simpsons S01E01 1080p BluRay x265 HEVC 10bit AAC 5.1 Tigole",
        1,
      );
      expect(episodes).toEqual([1]);
    });

    it("should return empty for non-matching season", () => {
      const episodes = episodesFromSeason(
        "The Simpsons S01E01-E02 1080p BluRay x265 HEVC 10bit AAC 5.1 Tigole",
        2,
      );
      expect(episodes).toEqual([]);
    });

    it("should return episodes for Game of Thrones S08", () => {
      const episodes = episodesFromSeason(
        "Game.of.Thrones.S08E01.1080p.WEB-DL.DDP5.1.H.264-GoT",
        8,
      );
      expect(episodes).toEqual([1]);
    });
  });

  describe("Yu-Gi-Oh episode extraction", () => {
    const testCases = [
      {
        title: "Yu-Gi-Oh! Zexal - 087 - Dual Duel, Part 1.mkv",
        expected: [87],
      },
      { title: "Yu-Gi-Oh! Zexal - 089 - Darkness Dawns.mkv", expected: [89] },
      {
        title: "Yu-Gi-Oh! Zexal - 090 - You Give Love a Bot Name.mkv",
        expected: [90],
      },
      { title: "Yu-Gi-Oh! Zexal - 091 - Take a Chance.mkv", expected: [91] },
      {
        title: "Yu-Gi-Oh! Zexal - 093 - An Imperfect Couple, Part 2.mkv",
        expected: [93],
      },
      { title: "Yu-Gi-Oh! Zexal - 094 - Enter Vector.mkv", expected: [94] },
    ];

    testCases.forEach(({ title, expected }) => {
      it(`should extract episode ${expected.toString()} from "${title}"`, () => {
        const episodes = extractEpisodes(title);
        expect(episodes).toEqual(expected);
      });
    });
  });
});
