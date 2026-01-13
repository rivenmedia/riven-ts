/* eslint-disable vitest/no-conditional-expect */
import { beforeEach, describe, expect, it } from "vitest";

import { checkRequired, fetchResolution } from "../fetch.ts";
import {
  type SettingsModel,
  SettingsModelSchema,
  checkFetch,
  compileSettingsPatterns,
  createDefaultSettings,
  parse,
} from "../index.ts";

describe("Fetch Tests", () => {
  let settings: SettingsModel;

  beforeEach(() => {
    settings = createDefaultSettings();
  });

  describe("checkFetch", () => {
    const testCases = [
      {
        rawTitle: "The.Lion.King.2019.1080p.BluRay.x264.DTS-HD.MA.7.1-FGT",
        expected: true,
      },
      { rawTitle: "Guardians of the Galaxy (2014)", expected: true },
      {
        rawTitle: "The Great Gatsby 2013 1080p BluRay x264 AAC - Ozlem",
        expected: true,
      },
      {
        rawTitle:
          "Turning.Red.2022.MULTi.DV.HDR.2160p.DSNP.WEB-DL.DDP5.1.x265.(Alerte.Rouge)-BONBON.mkv",
        expected: false,
      },
      {
        rawTitle:
          "The Adam Project 2022 1080p NF WEB-DL DDP 5 1 Atmos DoVi HDR HEVC-SiC mkv",
        expected: false,
      },
    ];

    testCases.forEach(({ rawTitle, expected }) => {
      it(`should return ${String(expected)} for "${rawTitle.substring(0, 50)}..."`, () => {
        const data = parse(rawTitle);
        const { fetch: isFetchable, failedKeys } = checkFetch(data, settings);

        expect(isFetchable).toBe(expected);

        if (!expected) {
          expect(failedKeys.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("fetchResolution", () => {
    const testCases = [
      {
        rawTitle: "The.Witcher.US.S01.INTERNAL.4k.WEB.x264-STRiFE",
        expected: false,
        expectedResolution: "2160p",
      },
      {
        rawTitle: "The.Witcher.US.S01.INTERNAL.2160p.WEB.x264-STRiFE",
        expected: false,
        expectedResolution: "2160p",
      },
      {
        rawTitle: "The.Witcher.US.S01.INTERNAL.1080p.WEB.x264-STRiFE",
        expected: true,
        expectedResolution: "1080p",
      },
      {
        rawTitle: "The.Witcher.US.S01.INTERNAL.720p.WEB.x264-STRiFE",
        expected: true,
        expectedResolution: "720p",
      },
      {
        rawTitle: "The.Witcher.US.S01.INTERNAL.480p.WEB.x264-STRiFE",
        expected: false,
        expectedResolution: "480p",
      },
      {
        rawTitle: "The.Witcher.US.S01.INTERNAL.360p.WEB.x264-STRiFE",
        expected: false,
        expectedResolution: "360p",
      },
      {
        rawTitle: "The.Witcher.US.S01.INTERNAL.WEB.x264-STRiFE",
        expected: true,
        expectedResolution: "unknown",
      },
    ];

    testCases.forEach(({ rawTitle, expected, expectedResolution }) => {
      it(`should ${expected ? "allow" : "reject"} resolution ${expectedResolution} for "${rawTitle}"`, () => {
        console.log(`Testing title: ${rawTitle}`);
        const data = parse(rawTitle);
        const failedKeys = new Set<string>();

        expect(data.resolution).toBe(expectedResolution);

        fetchResolution(data, settings, failedKeys);

        if (!expected) {
          expect(failedKeys.size).toBeGreaterThan(0);
        } else {
          expect(failedKeys.size).toBe(0);
        }
      });
    });
  });

  describe("checkRequired", () => {
    const testCases = [
      {
        rawTitle: "This is a 4k video",
        expected: true,
        message: "4K should match as case-insensitive",
      },
      {
        rawTitle: "This is a 1080P video",
        expected: true,
        message: "/1080p/ should match as case-sensitive",
      },
      {
        rawTitle: "House MD All Seasons (1-8) 720p Ultra-Compressed",
        expected: true,
        message: "Should match 'compressed'",
      },
      {
        rawTitle: "House MD All Seasons (1-8) 720p spider",
        expected: true,
        message: "Should match 'spider'",
      },
      {
        rawTitle: "This is a SpiDER test case",
        expected: true,
        message: "Should match 'spider' case-insensitively",
      },
      {
        rawTitle: "Awesome BluRay Release",
        expected: false,
        message: "Should not match '/awesome/'",
      },
      {
        rawTitle: "Exclusive HDR10+ Content",
        expected: false,
        message: "Should fail - not in required",
      },
    ];

    testCases.forEach(({ rawTitle, expected, message }) => {
      it(message, () => {
        const data = parse(rawTitle);
        const customSettings = compileSettingsPatterns(
          SettingsModelSchema.parse({
            require: [
              "4K",
              "/1080P/",
              "/awesome/",
              "SPIDER|Traffic|compressed",
            ],
          }),
        );
        const result = checkRequired(data, customSettings);
        expect(result).toBe(expected);
      });
    });
  });

  describe("checkExclude", () => {
    const testCases = [
      {
        rawTitle: "This is a 4k video",
        excludePatterns: ["4K"],
        expectedError: true,
      },
      {
        rawTitle: "This is a BraZil video",
        excludePatterns: ["brazil"],
        expectedError: true,
      },
      {
        rawTitle: "Low Quality CAM",
        excludePatterns: ["CAM"],
        expectedError: true,
      },
      {
        rawTitle: "Game.of.Thrones.S08E01.1080p.WEB-DL.DDP5.1.H.264-GoT",
        excludePatterns: ["\\d{2}"],
        expectedError: true,
      },
      {
        rawTitle: "Exclusive HDR10+ Content",
        excludePatterns: [],
        expectedError: false,
      },
    ];

    testCases.forEach(({ rawTitle, excludePatterns, expectedError }) => {
      it(`should ${expectedError ? "reject" : "accept"} "${rawTitle.substring(0, 40)}..."`, () => {
        const data = parse(rawTitle);
        const customSettings = compileSettingsPatterns(
          SettingsModelSchema.parse({ exclude: excludePatterns }),
        );
        const { fetch: isFetchable, failedKeys } = checkFetch(
          data,
          customSettings,
          false,
        );

        if (expectedError) {
          expect(isFetchable).toBe(false);
          expect(failedKeys.some((key) => key.includes("exclude_regex"))).toBe(
            true,
          );
        } else {
          expect(isFetchable).toBe(true);
        }
      });
    });
  });

  describe("required languages", () => {
    const testCases = [
      {
        rawTitle: "The Adam Project 2022 1080p",
        expected: true,
        expectedFailedKeys: [] as string[],
      },
      {
        rawTitle: "The Adam Project 2022 1080p VOSTFR",
        expected: false,
        expectedFailedKeys: ["lang_fr"],
      },
      {
        rawTitle: "The Adam Project 2022 1080p Spanish",
        expected: true,
        expectedFailedKeys: [] as string[],
      },
    ];

    testCases.forEach(({ rawTitle, expected, expectedFailedKeys }) => {
      it(`should ${expected ? "keep" : "exclude"} "${rawTitle}"`, () => {
        const customSettings = compileSettingsPatterns(
          SettingsModelSchema.parse({
            options: {
              removeUnknownLanguages: false,
              removeAllTrash: true,
            },
            languages: { exclude: ["fr"] },
          }),
        );

        const data = parse(rawTitle);
        const { fetch: isFetchable, failedKeys } = checkFetch(
          data,
          customSettings,
        );

        expect(isFetchable).toBe(expected);

        if (!expected) {
          expect(failedKeys).toEqual(
            expect.arrayContaining(expectedFailedKeys),
          );
        }
      });
    });
  });

  describe("HDR", () => {
    const testCases = [
      { title: "Game of Thrones S01 1080p HDR", expectedHdr: ["HDR"] },
      { title: "Game of Thrones S01 1080p", expectedHdr: [] as string[] },
    ];

    testCases.forEach(({ title, expectedHdr }) => {
      it(`should detect HDR ${expectedHdr.length > 0 ? expectedHdr.join(",") : "none"} in "${title}"`, () => {
        const data = parse(title);
        const failedKeys = new Set<string>();

        fetchResolution(data, settings, failedKeys);

        expect(failedKeys.size).toBe(0);
        expect(data.hdr).toEqual(expectedHdr);
      });
    });
  });
});
