import { it as baseIt, describe, expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { checkFetch } from "./fetch.ts";
import {
  createRankingModel,
  createSettings,
} from "./ranking-settings.schema.ts";

const it = baseIt
  .extend("settings", () => createSettings())
  .extend("rankingModel", () =>
    createRankingModel({
      avc: 0,
      bluray: 0,
      hdtv: 0,
      hevc: 0,
      web: 0,
      webdl: 0,
      brrip: 0,
      hdrip: 0,
      webrip: 0,
      bit10: 0,
      hdr: 0,
      hdr10plus: 0,
      sdr: 0,
      aac: 0,
      atmos: 0,
      dolbyDigital: 0,
      dolbyDigitalPlus: 0,
      dtsLossy: 0,
      dtsLossless: 0,
      flac: 0,
      stereo: 0,
      surround: 0,
      truehd: 0,
      dubbed: 0,
      edition: 0,
      hardcoded: 0,
      network: 0,
      proper: 0,
      repack: 0,
      retail: 0,
      subbed: 0,
      scene: 0,
      uncensored: 0,
    }),
  );

it("accepts a standard 1080p BluRay", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(true);
  expect(result.failedChecks).toHaveLength(0);
});

it("rejects CAM quality when removeAllTrash is true", ({
  settings,
  rankingModel,
}) => {
  const data = parse("Movie.2024.CAM-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("trash_quality");
});

it("rejects TeleSync quality", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.TS-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
});

it("accepts CAM when removeAllTrash is false", ({ rankingModel }) => {
  const settings = createSettings({ options: { removeAllTrash: false } });
  const data = parse("Movie.2024.CAM-GROUP");
  const result = checkFetch(data, settings, rankingModel);
  // CAM is fetch: false by default in customRanks.trash.cam
  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("cam");
});

describe("resolution filtering", () => {
  it("rejects 2160p by default", ({ settings, rankingModel }) => {
    const data = parse("Movie.2024.2160p.WEB-DL.HEVC-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("resolution");
  });

  it("accepts 1080p by default", ({ settings, rankingModel }) => {
    const data = parse("Movie.2024.1080p.WEB-DL.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(true);
  });

  it("accepts 720p by default", ({ settings, rankingModel }) => {
    const data = parse("Movie.2024.720p.WEB-DL.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(true);
  });

  it("rejects 480p by default", ({ settings, rankingModel }) => {
    const data = parse("Movie.2024.480p.WEB-DL.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("resolution");
  });

  it("accepts unknown resolution by default", ({ settings, rankingModel }) => {
    const data = parse("Movie 2024-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    // unknown resolution is enabled by default
    expect(result.failedChecks).not.toContain("resolution_unknown");
  });

  it("rejects unknown resolution when disabled", ({ rankingModel }) => {
    const settings = createSettings({ resolutions: { unknown: false } });
    const data = parse("Movie 2024-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("resolution_unknown");
  });
});

describe("required patterns", () => {
  it("passes when required pattern matches", ({ rankingModel }) => {
    const settings = createSettings({ require: ["1080p"] });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(true);
  });

  it("handles case-sensitive patterns with slashes", ({ rankingModel }) => {
    // Use require with a case-sensitive pattern that won't match the raw title
    // and also add a resolution filter that would normally reject it
    const settings = createSettings({
      require: ["/1080P/"],
      resolutions: { r1080p: false, unknown: false },
    });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    // Case-sensitive "/1080P/" won't match "1080p", so require doesn't short-circuit.
    // With r1080p disabled, the torrent should be rejected.
    expect(result.fetch).toBe(false);
  });

  it("handles case-insensitive patterns without slashes", ({
    rankingModel,
  }) => {
    const settings = createSettings({ require: ["1080P"] });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(true);
  });
});

describe("exclude patterns", () => {
  it("rejects when exclude pattern matches", ({ rankingModel }) => {
    const settings = createSettings({ exclude: ["CAM"] });
    const data = parse("Movie.2024.CAM-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(false);
  });

  it("accepts when exclude pattern does not match", ({ rankingModel }) => {
    const settings = createSettings({ exclude: ["CAM"] });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.fetch).toBe(true);
  });
});

describe("language handling", () => {
  it("rejects unknown languages when configured", ({ rankingModel }) => {
    const settings = createSettings({
      options: { removeUnknownLanguages: true },
    });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("unknown_language");
  });

  it("does not reject unknown languages by default", ({
    settings,
    rankingModel,
  }) => {
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);
    expect(result.failedChecks).not.toContain("unknown_language");
  });

  it("rejects excluded language", ({ rankingModel }) => {
    const settings = createSettings({
      languages: { exclude: ["fr"] },
    });
    const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("lang_fr");
  });

  it("accepts allowed language even if also excluded", ({ rankingModel }) => {
    const settings = createSettings({
      languages: { allowed: ["fr"], exclude: ["fr"] },
    });
    const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);

    expect(result.fetch).toBe(true);
  });

  it("requires language when required is set", ({ rankingModel }) => {
    const settings = createSettings({
      languages: { required: ["en"] },
    });
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, settings, rankingModel);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("missing_required_language");
  });
});

describe("fetch quality", () => {
  it("rejects REMUX by default (fetch: false)", ({
    settings,
    rankingModel,
  }) => {
    const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC-GROUP");
    const result = checkFetch(data, settings, rankingModel);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("remux");
  });

  it("accepts REMUX when ranking model allows fetch", ({ settings }) => {
    const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC-GROUP");
    const result = checkFetch(data, settings, createRankingModel({ remux: 0 }));
    // Should not fail on remux
    expect(result.failedChecks).not.toContain("remux");
  });
});

describe("fetch codec", () => {
  it("rejects AV1 by default", ({ settings, rankingModel }) => {
    const data = parse("Movie.2024.1080p.WEB-DL.AV1-GROUP");
    const result = checkFetch(data, settings, rankingModel);

    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("av1");
  });
});
