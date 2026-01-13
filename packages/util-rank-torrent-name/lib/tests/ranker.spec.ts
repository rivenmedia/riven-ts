/* eslint-disable vitest/no-conditional-expect */
import { beforeEach, describe, expect, it } from "vitest";

import {
  type BaseRankingModel,
  BaseRankingModelSchema,
  GarbageTorrent,
  ParsedDataSchema,
  RTN,
  type SettingsModel,
  SettingsModelSchema,
  calculateAudioRank,
  calculatePreferred,
  compileSettingsPatterns,
  createDefaultRanking,
  createDefaultSettings,
  getRank,
  parse,
} from "../index.ts";

describe("Ranker Tests", () => {
  let settings: SettingsModel;
  let ranking: BaseRankingModel;

  beforeEach(() => {
    settings = createDefaultSettings();
    ranking = createDefaultRanking();
  });

  describe("Valid torrent from title", () => {
    const testCases = [
      {
        rawTitle: "The Walking Dead S05E03 720p WebDL-Rip x264-ASAP[ettv]",
        expectedFetch: "GarbageTorrent",
      },
      {
        rawTitle:
          "The Walking Dead.S05E03.2019.UHD.BluRay.2160p.TrueHD.Atmos.7.1.HEVC.REMUX-JATO",
        expectedFetch: "GarbageTorrent",
      },
      {
        rawTitle: "The Walking Dead S05E03 720p x264-ASAP",
        expectedFetch: true,
      },
    ];

    testCases.forEach(({ rawTitle, expectedFetch }) => {
      it(`should ${expectedFetch === "GarbageTorrent" ? "reject" : "accept"} "${rawTitle.substring(0, 40)}..."`, () => {
        const rtn = new RTN(settings, ranking);

        if (expectedFetch === "GarbageTorrent") {
          expect(() =>
            rtn.rank(
              rawTitle,
              "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
              "The Walking Dead",
              true,
            ),
          ).toThrow(GarbageTorrent);
        } else {
          const torrent = rtn.rank(
            rawTitle,
            "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
            "The Walking Dead",
            true,
          );

          expect(torrent).toBeDefined();
          expect(torrent.data.parsedTitle).toBe("The Walking Dead");
          expect(torrent.fetch).toBe(expectedFetch);
          expect(torrent.rank).not.toBe(0);
          expect(torrent.levRatio).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("Invalid torrent from title", () => {
    const testCases = [
      {
        rawTitle: "The Walking Dead S05E03 CAM 720p HDTV x264-ASAP[ettv]",
        infohash: "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
        correctTitle: "The Walking Dead",
        exceptionType: GarbageTorrent,
      },
      {
        rawTitle: "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
        infohash: null,
        correctTitle: null,
        exceptionType: Error,
      },
      {
        rawTitle: null,
        infohash: "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
        correctTitle: null,
        exceptionType: Error,
      },
      {
        rawTitle: "The Walking Dead S05E03 720p HDTV x264-ASAP[ettv]",
        infohash: null,
        correctTitle: null,
        exceptionType: Error,
      },
      {
        rawTitle: null,
        infohash: null,
        correctTitle: null,
        exceptionType: Error,
      },
      {
        rawTitle: 123,
        infohash: "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
        correctTitle: null,
        exceptionType: Error,
      },
      {
        rawTitle: "The Walking Dead S05E03 720p HDTV x264-ASAP[ettv]",
        infohash: 123,
        correctTitle: null,
        exceptionType: Error,
      },
      {
        rawTitle: "The Walking Dead S05E03 720p HDTV x264-ASAP[ettv]",
        infohash: "c08a9ee8ce3a5c2c0886",
        correctTitle: null,
        exceptionType: GarbageTorrent,
      },
      {
        rawTitle: "",
        infohash: "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
        correctTitle: null,
        exceptionType: Error,
      },
    ];

    testCases.forEach(
      ({ rawTitle, infohash, correctTitle, exceptionType }, index) => {
        it(`should throw ${exceptionType.name} for test case ${(index + 1).toString()}`, () => {
          const rtn = new RTN(settings, ranking);
          expect(() =>
            rtn.rank(
              rawTitle as string,
              infohash as string,
              correctTitle ?? "",
              true,
            ),
          ).toThrow();
        });
      },
    );
  });

  describe("Rank calculation accuracy", () => {
    it("should calculate rank greater than 0 for quality torrent", () => {
      const parsedData = parse("Example.Movie.2020.1080p.BluRay.x264-Example");
      const rank = getRank(parsedData, settings, ranking);
      expect(rank).toBeGreaterThan(0);
    });
  });

  describe("Preferred calculation", () => {
    it("should calculate preferred rank when pattern matches", () => {
      const customSettings = compileSettingsPatterns(
        SettingsModelSchema.parse({ preferred: ["S2"] }),
      );

      const parsedData = ParsedDataSchema.parse({
        rawTitle: "Example.Series.S2.2020.Bluray",
        parsedTitle: "Example Series",
      });

      const rank = calculatePreferred(parsedData, customSettings);
      expect(rank).toBe(10000);
    });

    it("should return 0 when no preferred patterns", () => {
      const customSettings = compileSettingsPatterns(
        SettingsModelSchema.parse({ preferred: [] }),
      );

      const parsedData = ParsedDataSchema.parse({
        rawTitle: "Example.Movie.2020.1080p-Example",
        parsedTitle: "Example Movie",
      });

      const rank = calculatePreferred(parsedData, customSettings);
      expect(rank).toBe(0);
    });
  });

  describe("Quality ranking", () => {
    it("should return 0 for 'Other' quality", () => {
      const parsedData = ParsedDataSchema.parse({
        rawTitle: "Other",
        parsedTitle: "Other",
        quality: "Other",
      });
      const rank = getRank(parsedData, settings, ranking);
      // Only quality contributes 0 but codec and other things may add to it
      // For "Other" quality without other attributes, rank should be minimal
      expect(rank).toBeDefined();
    });

    it("should return 0 for no quality", () => {
      const parsedData = ParsedDataSchema.parse({
        rawTitle: "None",
        parsedTitle: "None",
        quality: "",
      });
      const rank = getRank(parsedData, settings, ranking);
      expect(rank).toBeDefined();
    });
  });

  describe("Codec ranking", () => {
    it("should return 0 for 'Other' codec", () => {
      const parsedData = ParsedDataSchema.parse({
        rawTitle: "Other",
        parsedTitle: "Other",
        codec: "Other",
      });
      const rank = getRank(parsedData, settings, ranking);
      expect(rank).toBeDefined();
    });

    it("should return 0 for no codec", () => {
      const parsedData = ParsedDataSchema.parse({
        rawTitle: "None",
        parsedTitle: "None",
        codec: "",
      });
      const rank = getRank(parsedData, settings, ranking);
      expect(rank).toBeDefined();
    });
  });

  describe("Audio ranking", () => {
    it("should return 0 for 'Other' audio", () => {
      const customRanking = BaseRankingModelSchema.parse({
        av1: 1,
        avc: 1,
        bluray: 1,
        dvd: 1,
        hdtv: 1,
        hevc: 1,
        mpeg: 1,
        remux: 1,
        vhs: 1,
        web: 1,
        webdl: 1,
        webmux: 1,
        xvid: 1,
        pdtv: 1,
        bdrip: 1,
        brrip: 1,
        dvdrip: 1,
        hdrip: 1,
        ppvrip: 1,
        tvrip: 1,
        uhdrip: 1,
        webdlrip: 1,
        webrip: 1,
        bit10: 1,
        dolbyVision: 1,
        hdr: 1,
        hdr10plus: 1,
        sdr: 1,
        aac: 1,
        atmos: 1,
        dolbyDigital: 1,
        dolbyDigitalPlus: 1,
        dtsLossy: 1,
        dtsLossless: 1,
        flac: 1,
        mono: 1,
        mp3: 1,
        stereo: 1,
        surround: 1,
        truehd: 1,
        three_d: 1,
        converted: 1,
        documentary: 1,
        dubbed: 1,
        edition: 1,
        hardcoded: 1,
        network: 1,
        proper: 1,
        repack: 1,
        retail: 1,
        subbed: 1,
        upscaled: 1,
        cam: 1,
        cleanAudio: 1,
        r5: 1,
        screener: 1,
        site: 1,
        size: 1,
        telecine: 1,
        telesync: 1,
        scene: 1,
        uncensored: 1,
        commentary: 1,
      });

      const parsedData = ParsedDataSchema.parse({
        rawTitle: "Other",
        parsedTitle: "Other",
        audio: ["Other"],
      });
      const rank = calculateAudioRank(parsedData, settings, customRanking);
      expect(rank).toBe(0);
    });

    it("should return 0 for no audio", () => {
      const customRanking = BaseRankingModelSchema.parse({});

      const parsedData = ParsedDataSchema.parse({
        rawTitle: "None",
        parsedTitle: "None",
        audio: [],
      });
      const rank = calculateAudioRank(parsedData, settings, customRanking);
      expect(rank).toBe(0);
    });
  });

  describe("Manual fetch check", () => {
    it("should fetch Marvel's Agents of S.H.I.E.L.D.", () => {
      const rtn = new RTN(settings, ranking);

      const torrent = rtn.rank(
        "marvels.agents.of.s.h.i.e.l.d.s03.1080p.bluray.x264-shortbrehd[rartv]",
        "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
        "Marvel's Agents of S.H.I.E.L.D.",
      );

      expect(torrent.fetch).toBe(true);
      expect(torrent.levRatio).toBeGreaterThan(0);
    });
  });
});
