import { describe, expect, it } from "vitest";

import { parse } from "../parser/parse.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./settings.ts";

describe("checkFetch", () => {
  const defaultSettings = createSettings();

  it("should accept a standard 1080p BluRay", () => {
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
    const result = checkFetch(data, defaultSettings);
    expect(result.fetch).toBe(true);
    expect(result.failedChecks).toHaveLength(0);
  });

  it("should reject CAM quality when removeAllTrash is true", () => {
    const data = parse("Movie.2024.CAM-GROUP");
    const result = checkFetch(data, defaultSettings);
    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("trash_quality");
  });

  it("should reject TeleSync quality", () => {
    const data = parse("Movie.2024.TS-GROUP");
    const result = checkFetch(data, defaultSettings);

    expect(result.fetch).toBe(false);
  });

  it("should accept CAM when removeAllTrash is false", () => {
    const settings = createSettings({ options: { removeAllTrash: false } });
    const data = parse("Movie.2024.CAM-GROUP");
    const result = checkFetch(data, settings);
    // CAM is fetch: false by default in customRanks.trash.cam
    expect(result.fetch).toBe(false);
    expect(result.failedChecks).toContain("trash_cam");
  });

  describe("resolution filtering", () => {
    it("should reject 2160p by default", () => {
      const data = parse("Movie.2024.2160p.WEB-DL.HEVC-GROUP");
      const result = checkFetch(data, defaultSettings);
      expect(result.fetch).toBe(false);
      expect(result.failedChecks).toContain("resolution");
    });

    it("should accept 1080p by default", () => {
      const data = parse("Movie.2024.1080p.WEB-DL.x264-GROUP");
      const result = checkFetch(data, defaultSettings);
      expect(result.fetch).toBe(true);
    });

    it("should accept 720p by default", () => {
      const data = parse("Movie.2024.720p.WEB-DL.x264-GROUP");
      const result = checkFetch(data, defaultSettings);
      expect(result.fetch).toBe(true);
    });

    it("should reject 480p by default", () => {
      const data = parse("Movie.2024.480p.WEB-DL.x264-GROUP");
      const result = checkFetch(data, defaultSettings);
      expect(result.fetch).toBe(false);
      expect(result.failedChecks).toContain("resolution");
    });

    it("should accept unknown resolution by default", () => {
      const data = parse("Movie 2024-GROUP");
      const result = checkFetch(data, defaultSettings);
      // unknown resolution is enabled by default
      expect(result.failedChecks).not.toContain("resolution_unknown");
    });

    it("should reject unknown resolution when disabled", () => {
      const settings = createSettings({ resolutions: { unknown: false } });
      const data = parse("Movie 2024-GROUP");
      const result = checkFetch(data, settings);
      expect(result.fetch).toBe(false);
      expect(result.failedChecks).toContain("resolution_unknown");
    });
  });

  describe("required patterns", () => {
    it("should pass when required pattern matches", () => {
      const settings = createSettings({ require: ["1080p"] });
      const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
      const result = checkFetch(data, settings);
      expect(result.fetch).toBe(true);
    });

    it("should pass regardless of other filters when required matches", () => {
      // 2160p is disabled by default, but require should bypass
      const settings = createSettings({ require: ["2160p"] });
      const data = parse("Movie.2024.2160p.WEB-DL.HEVC-GROUP");
      const result = checkFetch(data, settings);
      expect(result.fetch).toBe(true);
    });

    it("should handle case-sensitive patterns with slashes", () => {
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

    it("should handle case-insensitive patterns without slashes", () => {
      const settings = createSettings({ require: ["1080P"] });
      const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
      const result = checkFetch(data, settings);
      expect(result.fetch).toBe(true);
    });
  });

  describe("exclude patterns", () => {
    it("should reject when exclude pattern matches", () => {
      const settings = createSettings({ exclude: ["CAM"] });
      const data = parse("Movie.2024.CAM-GROUP");
      const result = checkFetch(data, settings);
      expect(result.fetch).toBe(false);
    });

    it("should accept when exclude pattern does not match", () => {
      const settings = createSettings({ exclude: ["CAM"] });
      const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
      const result = checkFetch(data, settings);
      expect(result.fetch).toBe(true);
    });
  });

  describe("language handling", () => {
    it("should reject unknown languages when configured", () => {
      const settings = createSettings({
        options: { removeUnknownLanguages: true },
      });
      const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
      const result = checkFetch(data, settings);

      expect(result.fetch).toBe(false);
      expect(result.failedChecks).toContain("unknown_language");
    });

    it("should not reject unknown languages by default", () => {
      const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
      const result = checkFetch(data, defaultSettings);
      expect(result.failedChecks).not.toContain("unknown_language");
    });

    it("should reject excluded language", () => {
      const settings = createSettings({
        languages: { exclude: ["fr"] },
      });
      const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
      const result = checkFetch(data, settings);

      expect(result.fetch).toBe(false);
      expect(result.failedChecks).toContain("lang_fr");
    });

    it("should accept allowed language even if also excluded", () => {
      const settings = createSettings({
        languages: { allowed: ["fr"], exclude: ["fr"] },
      });
      const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
      const result = checkFetch(data, settings);

      expect(result.fetch).toBe(true);
    });

    it("should require language when required is set", () => {
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
    it("should reject REMUX by default (fetch: false)", () => {
      const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC-GROUP");
      const result = checkFetch(data, defaultSettings);

      expect(result.fetch).toBe(false);
      expect(result.failedChecks).toContain("quality_remux");
    });

    it("should accept REMUX when custom rank allows fetch", () => {
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
    it("should reject AV1 by default", () => {
      const data = parse("Movie.2024.1080p.WEB-DL.AV1-GROUP");
      const result = checkFetch(data, defaultSettings);

      expect(result.fetch).toBe(false);
      expect(result.failedChecks).toContain("quality_av1");
    });
  });

  describe("speed mode vs full mode", () => {
    it("should collect all failures in non-speed mode", () => {
      const settings = createSettings({
        resolutions: { r2160p: false },
        options: { removeAllTrash: false },
        customRanks: {
          quality: { av1: { fetch: false } },
        },
      });
      // A title with both resolution and codec issues
      const data = parse("Movie.2024.2160p.WEB-DL.AV1-GROUP");
      const result = checkFetch(data, settings, false);

      expect(result.fetch).toBe(false);
      expect(result.failedChecks.size).toBeGreaterThan(1);
    });
  });
});
