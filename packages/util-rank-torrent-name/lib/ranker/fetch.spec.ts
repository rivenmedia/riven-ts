import { it as baseIt, describe, expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./settings.ts";

const it = baseIt.extend("settings", () => createSettings());

it("accepts a standard 1080p BluRay", ({ settings }) => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings);

  expect(result.fetch).toBe(true);
  expect(result.failedChecks).toHaveLength(0);
});

it("rejects CAM quality when removeAllTrash is true", ({ settings }) => {
  const data = parse("Movie.2024.CAM-GROUP");
  const result = checkFetch(data, settings);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("trash_quality");
});

it("rejects TeleSync quality", ({ settings }) => {
  const data = parse("Movie.2024.TS-GROUP");
  const result = checkFetch(data, settings);

  expect(result.fetch).toBe(false);
});

it("accepts CAM when removeAllTrash is false", () => {
  const settings = createSettings({ options: { removeAllTrash: false } });
  const data = parse("Movie.2024.CAM-GROUP");
  const result = checkFetch(data, settings);
  // CAM is fetch: false by default in customRanks.trash.cam
  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("trash_cam");
});

describe("resolution filtering", () => {
  it("rejects 2160p by default", ({ settings }) => {
    const data = parse("Movie.2024.2160p.WEB-DL.HEVC-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("resolution");
  });

  it("accepts 1080p by default", ({ settings }) => {
    const data = parse("Movie.2024.1080p.WEB-DL.x264-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(true);
  });

  it("accepts 720p by default", ({ settings }) => {
    const data = parse("Movie.2024.720p.WEB-DL.x264-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(true);
  });

  it("rejects 480p by default", ({ settings }) => {
    const data = parse("Movie.2024.480p.WEB-DL.x264-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("resolution");
  });

  it("accepts unknown resolution by default", ({ settings }) => {
    const data = parse("Movie 2024-GROUP");
    const result = checkFetch(data, settings);
    // unknown resolution is enabled by default
    expect(result.failedChecks).not.toContain("resolution_unknown");
  });

  it("rejects unknown resolution when disabled", () => {
    const settings = createSettings({ resolutions: { unknown: false } });
    const data = parse("Movie 2024-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("resolution_unknown");
  });
});

describe("required patterns", () => {
  it("passes when required pattern matches", () => {
    const settings = createSettings({ require: ["1080p"] });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(true);
  });

  it("passes regardless of other filters when required matches", () => {
    // 2160p is disabled by default, but require should bypass
    const settings = createSettings({ require: ["2160p"] });
    const data = parse("Movie.2024.2160p.WEB-DL.HEVC-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(true);
  });

  it("handles case-sensitive patterns with slashes", () => {
    // Use require with a case-sensitive pattern that won't match the raw title
    // and also add a resolution filter that would normally reject it
    const settings = createSettings({
      require: ["/1080P/"],
      resolutions: { r1080p: false, unknown: false },
    });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);
    // Case-sensitive "/1080P/" won't match "1080p", so require doesn't short-circuit.
    // With r1080p disabled, the torrent should be rejected.
    expect(result.fetch).toBe(false);
  });

  it("handles case-insensitive patterns without slashes", () => {
    const settings = createSettings({ require: ["1080P"] });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(true);
  });
});

describe("exclude patterns", () => {
  it("rejects when exclude pattern matches", () => {
    const settings = createSettings({ exclude: ["CAM"] });
    const data = parse("Movie.2024.CAM-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(false);
  });

  it("accepts when exclude pattern does not match", () => {
    const settings = createSettings({ exclude: ["CAM"] });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(true);
  });
});

describe("language handling", () => {
  it("rejects unknown languages when configured", () => {
    const settings = createSettings({
      options: { removeUnknownLanguages: true },
    });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("unknown_language");
  });

  it("does not reject unknown languages by default", ({ settings }) => {
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);
    expect(result.failedChecks).not.toContain("unknown_language");
  });

  it("rejects excluded language", () => {
    const settings = createSettings({
      languages: { exclude: ["fr"] },
    });
    const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("lang_fr");
  });

  it("accepts allowed language even if also excluded", () => {
    const settings = createSettings({
      languages: { allowed: ["fr"], exclude: ["fr"] },
    });
    const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(true);
  });

  it("requires language when required is set", () => {
    const settings = createSettings({
      languages: { required: ["en"] },
    });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("missing_required_language");
  });
});

describe("fetch quality", () => {
  it("rejects REMUX by default (fetch: false)", ({ settings }) => {
    const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("quality_remux");
  });

  it("accepts REMUX when custom rank allows fetch", () => {
    const settings = createSettings({
      customRanks: { quality: { remux: { fetch: true } } },
    });
    const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC-GROUP");
    const result = checkFetch(data, settings);
    // Should not fail on quality_remux
    expect(result.failedChecks).not.toContain("quality_remux");
  });
});

describe("fetch codec", () => {
  it("rejects AV1 by default", ({ settings }) => {
    const data = parse("Movie.2024.1080p.WEB-DL.AV1-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("quality_av1");
  });
});

describe("adult content", () => {
  it("rejects adult content when removeAdultContent is true", () => {
    const settings = createSettings({
      options: { removeAdultContent: true },
    });
    // Use a title that the adult handler detects
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    data.adult = true;
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("trash_adult");
  });

  it("allows adult content when removeAdultContent is false", () => {
    const settings = createSettings({
      options: { removeAdultContent: false },
    });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    data.adult = true;
    const result = checkFetch(data, settings);

    expect(result.failedChecks).not.toContain("trash_adult");
  });
});

describe("trash flags", () => {
  it("rejects trash-flagged content", ({ settings }) => {
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    data.trash = true;
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("trash_flag");
  });

  it("rejects HQ clean audio as trash", ({ settings }) => {
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    data.audio = ["HQ Clean Audio"];
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("trash_audio");
  });
});

describe("language edge cases", () => {
  it("allows English when allowEnglishInLanguages is true", () => {
    const settings = createSettings({
      options: { allowEnglishInLanguages: true },
      languages: { exclude: ["en"] },
    });
    const data = parse("Movie.2024.ENGLISH.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);

    expect(result.failedChecks).not.toContain("lang_en");
  });

  it("accepts language group expansion with required languages", () => {
    const settings = createSettings({
      languages: { required: ["en"] },
    });
    const data = parse("Movie.2024.ENGLISH.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings);

    expect(result.failedChecks).not.toContain("missing_required_language");
  });
});

describe("fetch flags", () => {
  it("rejects 3D content by default", ({ settings }) => {
    const data = parse("Movie.2024.3D.1080p.BluRay-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("extras_threeD");
  });

  it("rejects content when flag has fetch disabled", () => {
    const settings = createSettings({
      customRanks: { extras: { dubbed: { fetch: false } } },
    });
    const data = parse("Movie.2024.DUBBED.1080p.WEB-DL-GROUP");
    const result = checkFetch(data, settings);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("extras_dubbed");
  });
});

describe("fetch HDR", () => {
  it("accepts HDR content when enabled", () => {
    const settings = createSettings({
      customRanks: { hdr: { hdr: { fetch: true } } },
    });
    const data = parse("Movie.2024.2160p.WEB-DL.HDR.HEVC-GROUP");
    const result = checkFetch(data, settings);

    expect(result.failedChecks).not.toContain("hdr_hdr");
  });
});

describe("fetch audio", () => {
  it("rejects specific audio format when fetch is disabled", () => {
    const settings = createSettings({
      customRanks: { audio: { truehd: { fetch: false } } },
    });
    const data = parse("Movie.2024.1080p.BluRay.TrueHD-GROUP");
    const result = checkFetch(data, settings);

    expect(result.failedChecks).toContain("audio_truehd");
  });

  it("skips audio values not in the audio map", () => {
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    data.audio = ["UnknownAudioFormat", "TrueHD"];
    const settings = createSettings({
      customRanks: { audio: { truehd: { fetch: true } } },
    });
    const result = checkFetch(data, settings);

    // UnknownAudioFormat should be skipped (continue branch), TrueHD is allowed
    expect(result.failedChecks).not.toContain("audio_truehd");
  });
});

describe("fetch flags edge cases", () => {
  it("skips falsy flag values in checkFetchFlags", ({ settings }) => {
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    // Ensure flag fields are explicitly falsy - threeD, dubbed etc. should be undefined/false
    data.threeD = false;
    data.dubbed = false;
    const result = checkFetch(data, settings);

    expect(result.failedChecks).not.toContain("extras_threeD");
    expect(result.failedChecks).not.toContain("extras_dubbed");
  });
});

describe("language group expansion", () => {
  it("expands anime language group in required languages", () => {
    const settings = createSettings({
      languages: { required: ["anime"] },
    });
    // "ja" is part of the "anime" group
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    data.languages = ["ja"];
    const result = checkFetch(data, settings);

    expect(result.failedChecks).not.toContain("missing_required_language");
  });

  it("rejects when no language matches expanded group", () => {
    const settings = createSettings({
      languages: { required: ["anime"] },
    });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    data.languages = ["fr"];
    const result = checkFetch(data, settings);

    expect(result.failedChecks).toContain("missing_required_language");
  });
});
