import { expect, it } from "vitest";

import { parse } from "../../parser/parse.ts";
import { RTN } from "../../rtn.ts";
import { normaliseTitle } from "../../shared/normalise.ts";
import { adultHandler, languageHandler, trashHandler } from "../fetch.ts";
import { getLevRatio, titleMatch } from "../lev.ts";
import { createSettings } from "../settings.ts";

it.each([
  ["The Walking Dead", "The Running Dead", true, 0.875],
  ["The Walking Dead S05E03 720p HDTV x264-ASAP", "The Walking Dead", true, 1],
  [
    "marvels.agents.of.s.h.i.e.l.d.s03.1080p.bluray.x264-shortbrehd[rartv]",
    "Marvel's Agents of S.H.I.E.L.D.",
    true,
    1,
  ],
  ["The Walking Dead", "Oppenheimer", false, 0],
])(
  "calculates the correct levenshtein ratio for %s",
  (rawTitle, correctTitle, expectedMatch, expectedRatio) => {
    const data = parse(rawTitle);
    const match = titleMatch(correctTitle, data.title);
    const ratio = getLevRatio(correctTitle, data.title);

    expect(match).toBe(expectedMatch);
    expect(ratio).toBe(expectedRatio);
  },
);

it.each([
  ["The Walking Dead", "the walking dead"],
  ["Marvel's Agents of S.H.I.E.L.D.", "marvels agents of s h i e l d"],
  ["The Walking Dead S05E03 720p HDTV x264-ASAP", "the walking dead"],
  ["фуриоса: хроники безумного макса", "фуриоса хроники безумного макса"],
  ["200% Wolf", "200 wolf"],
])("normalises the title for %s", (rawTitle, correctTitle) => {
  const data = parse(rawTitle);
  const normalisedTitle = normaliseTitle(data.title);

  expect(normalisedTitle).toBe(correctTitle);
});

it("sorts torrents correctly", () => {
  const torrents = {
    "1234567890123456789012345678901234567890":
      "Sprint.2024.S01.COMPLETE.1080p.WEBDL.h264-EDITH[TGx]",
    "1234567890123456789012345678901234567891":
      "Madame Web 2024 1080p WEBRip 1400MB DD 5.1 x264-GalaxyRG[TGx]",
    "1234567890123456789012345678901234567892":
      "Guardians of the Galaxy Vol. 2 (2017) 720p HDTC x264 MKVTV",
    "1234567890123456789012345678901234567893":
      "Wonder Woman 1984 (2020) [1440p DoVi P8 DTSHD AC3 En-AC3",
    "1234567890123456789012345678901234567894":
      "8 Bit Christmas (2021) - x264 - Telugu (Fan Dub)",
    "1234567890123456789012345678901234567895":
      "[SubsPlease] Fairy Tail - 100 Years Quest - 05 (1080p) [1107F3A9].mkv",
  };

  const expectedOrder = [
    "1234567890123456789012345678901234567893", // Wonder Woman 1984 (2020) [UHDRemux 2160p DoVi P8 Es-DTSHD AC3 En-AC3
    "1234567890123456789012345678901234567890", // Sprint.2024.S01.COMPLETE.1080p.WEBDL-Rip.h264-EDITH[TGx]
    "1234567890123456789012345678901234567895", // [SubsPlease] Fairy Tail - 100 Years Quest - 05 (1080p) [1107F3A9].mkv
    "1234567890123456789012345678901234567891", // Madame Web 2024 1080p WEBRip 1400MB DD 5.1 x264-GalaxyRG[TGx]
    "1234567890123456789012345678901234567892", // Guardians of the Galaxy Vol. 2 (2017) 720p HDTC x264 MKVTV
    "1234567890123456789012345678901234567894", // ww.Tamilblasters.sbs - 8 Bit Christmas (2021) HQ HDRip - x264 - Telugu (Fan Dub) - 400MB
  ];

  const settings = createSettings();
  const rtnInstance = new RTN(settings);
  const rankedTorrents = rtnInstance.rankTorrents(torrents).keys().toArray();

  expect(rankedTorrents).toEqual(expectedOrder);
});

it("sorts torrents with a resolution filter correctly", () => {
  const torrents = {
    "1234567890123456789012345678901234567890":
      "Sprint.2024.S01.COMPLETE.1080p.WEBDL.h264-EDITH[TGx]",
    "1234567890123456789012345678901234567891":
      "Madame Web 2024 1080p WEBRip DD 5.1 x264-GalaxyRG[TGx]",
    "1234567890123456789012345678901234567892":
      "Guardians of the Galaxy Vol. 2 (2017) 720p x264 MKVTV",
    "1234567890123456789012345678901234567893":
      "Wonder Woman 1984 (2020) [1440p DoVi P8 DTSHD AC3 En-AC3",
    "1234567890123456789012345678901234567894":
      "8 Bit Christmas (2021) - x264 - Telugu (Fan Dub)",
    "1234567890123456789012345678901234567895":
      "[SubsPlease] Fairy Tail - 100 Years Quest - 05 (1080p) [1107F3A9].mkv",
  } as const;

  const settings = createSettings({
    resolutions: {
      r1440p: true,
      r1080p: false,
      r720p: false,
      unknown: false,
    },
  });
  const rtnInstance = new RTN(settings);
  const rankedTorrents = rtnInstance.rankTorrents(torrents).keys().toArray();

  const expectedOrder = [
    "1234567890123456789012345678901234567893", // Wonder Woman 1984 (2020) [1440p DoVi P8 DTSHD AC3 En-AC3
  ];

  expect(rankedTorrents).toEqual(expectedOrder);
});

it.each([
  ["The Walking Dead S05E03", false],
  ["The Walking Dead S05E03 [English]", false],
  ["The Walking Dead S05E03 [English] [Spanish]", true],
])(
  "handles languages exclusions correctly for %s",
  (rawTitle, expectedExclude) => {
    const settings = createSettings({
      options: {
        allowEnglishInLanguages: false,
      },
      languages: {
        exclude: ["es"],
      },
    });
    const data = parse(rawTitle);
    const excludeLanguagesResult = languageHandler(data, settings, new Set());

    expect(excludeLanguagesResult).toBe(expectedExclude);
  },
);

it.each([
  ["Deadpool & Wolverine (2024) Eng 1080p V3 HDTS AAC ESub mkv", true],
  ["Deadpool & Wolverine (2024) HDTS mkv", true],
  ["Deadpool&Wolverine 2024-TeleSync mkv", true],
  [
    "Deadpool & Wolverine (2024) 1080p TELESYNC V4 [Hindi + English] AAC Dual Audio ESub x264 AVC - 2700MB - [PotonMovies]",
    true,
  ],
  [
    "Deadpool.And.Wolverine.2024.2160p.HDR.Multi.Audio.TELESYNC.HEVC.COLLECTiVE",
    true,
  ],
  ["The Walking Dead S05E03 720p x264-ASAP", false],
])("handles trash detection for %s", (rawTitle, expectedTrash) => {
  const data = parse(rawTitle);
  const trashResult = trashHandler(data, createSettings(), new Set());

  expect(trashResult).toBe(expectedTrash);
});

it.each([
  [
    "Mad.Max.Fury.Road.2015.1080p.BluRay.DDP5.1.x265.10bit-GalaxyRG265[TGx]",
    "movie",
    [],
    [],
  ],
  [
    "Furiosa A Mad Max Saga (2024) [1080p] [WEBRip] [x265] [10bit] [5.1] [YTS.MX]",
    "movie",
    [],
    [],
  ],
  ["The Walking Dead S05E03 720p x264-ASAP", "show", [5], [3]],
])(
  "handles type checking for %s",
  (rawTitle, expectedType, expectedSeasons, expectedEpisodes) => {
    const data = parse(rawTitle);

    expect(data.type).toBe(expectedType);
    expect(data.seasons).toEqual(expectedSeasons);
    expect(data.episodes).toEqual(expectedEpisodes);
  },
);

it.each([
  ["Deadpool & Wolverine (2024) Eng 1080p V3 HDTS AAC ESub xvideos mkv", true],
  ["The Walking Dead S05E03 720p x264-ASAP vrporn", true],
  ["The Walking Dead S05E03 720p x264-ASAP", false],
])("handles adult content detection for %s", (rawTitle, expectedAdult) => {
  const settings = createSettings({
    options: {
      removeAdultContent: true,
    },
  });
  const data = parse(rawTitle);
  const adultResult = adultHandler(data, settings, new Set());

  expect(adultResult).toBe(expectedAdult);
});

it("handles bucket limits correctly", () => {
  // Unknown resolution torrents
  const unknownResTorrents = {
    efe476b52c7f5504042a036bd32adf2af9327e91: "Movie.2024.1.WEB-DL.mkv",
    a44e8e42dd21212c2da7a7ff5592cb365b10ee5a: "Movie.2024.2.WEB-DL.mkv",
    ecb8bd9f5c3682bb08b62264cc53a8fe095946f0: "Movie.2024.3.WEB-DL.mkv",
  };

  // 1080p torrents
  const hdTorrents = {
    bc10e7a6895ef41633cf4966e880fd7da14bff28: "Movie.2024.4.1080p.WEB-DL.mkv",
    d0eb09414bb94152b4ffbe81023894a568118dd7: "Movie.2024.5.1080p.BluRay.mkv",
    "611df0d2d1fd026896d013ecedeef1c1a4fc16a9": "Movie.2024.6.1080p.WEBDL.mkv",
  };

  // 720p torrents
  const sdTorrents = {
    e71e1f9d57e17fce640af4410a49e28bba18dd1a: "Movie.2024.720p.WEB-DL.mkv",
    d61e9402608769c6a1d02a1705a059f148b439bf: "Movie.2024.720p.BluRay.mkv",
    "38b640c9b942b95565fb69eb17470b1b8d0e23bc": "Movie.2024.720p.WEBDL.mkv",
  };

  const rtnInstance = new RTN(createSettings());
  const rankedTorrents = rtnInstance.rankTorrents(
    {
      ...unknownResTorrents,
      ...hdTorrents,
      ...sdTorrents,
    },
    2,
  );

  console.log(rankedTorrents);

  // Verify we get at most 2 torrents per resolution bucket

  const unknownResults = [...rankedTorrents.values()].filter(
    (result) => result.data.resolution === "unknown",
  );
  const hdResults = [...rankedTorrents.values()].filter(
    (result) => result.data.resolution === "1080p",
  );
  const sdResults = [...rankedTorrents.values()].filter(
    (result) => result.data.resolution === "720p",
  );

  expect(unknownResults.length).toBeLessThanOrEqual(2);
  expect(hdResults.length).toBeLessThanOrEqual(2);
  expect(sdResults.length).toBeLessThanOrEqual(2);

  const expectedTotal = 6; // 2 from each resolution bucket

  expect(rankedTorrents.size).toBe(expectedTotal);
});
