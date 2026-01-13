import { describe, expect, it } from "vitest";

import { SettingsModelSchema, compileSettingsPatterns } from "../index.ts";

describe("Settings Tests", () => {
  describe("Pattern matching", () => {
    const testCases = [
      { title: "This is a 4K video", expectedMatch: true },
      { title: "This is a 1080p video", expectedMatch: true },
      { title: "Low Quality CAM", expectedMatch: false },
      { title: "Awesome BluRay Release", expectedMatch: true },
      { title: "Exclusive HDR10+ Content", expectedMatch: true },
    ];

    testCases.forEach(({ title, expectedMatch }) => {
      it(`should ${expectedMatch ? "match" : "not match"} "${title}"`, () => {
        const customSettings = compileSettingsPatterns(
          SettingsModelSchema.parse({
            require: ["/4K/", "1080p"],
            exclude: ["CAM|TS|Telesync"],
            preferred: ["BluRay", "HDR10+"],
          }),
        );

        const requireMatches = customSettings.require.some((pattern) =>
          (pattern as RegExp).test(title),
        );
        const excludeMatches = customSettings.exclude.some((pattern) =>
          (pattern as RegExp).test(title),
        );
        const preferredMatches = customSettings.preferred.some((pattern) =>
          (pattern as RegExp).test(title),
        );

        const result = (requireMatches && !excludeMatches) || preferredMatches;
        expect(result).toBe(expectedMatch);
      });
    });
  });

  describe("Pattern handling", () => {
    it("should throw for invalid pattern type", () => {
      expect(() => {
        SettingsModelSchema.parse({ require: ["4K", 1080] });
      }).toThrow();
    });

    it("should support regex Pattern objects", () => {
      const customSettings = compileSettingsPatterns(
        SettingsModelSchema.parse({
          require: [/\b4K|1080p\b/, /720p/],
        }),
      );
      expect(
        customSettings.require.every((pattern) => pattern instanceof RegExp),
      ).toBe(true);
    });

    it("should support mixed regex Patterns and strings", () => {
      const customSettings = compileSettingsPatterns(
        SettingsModelSchema.parse({
          require: [/\b4K|1080p\b/, "/720p/"],
        }),
      );
      expect(
        customSettings.require.every((pattern) => pattern instanceof RegExp),
      ).toBe(true);
    });
  });

  describe("changed_only equivalent", () => {
    it("should return only non-default values", () => {
      const customSettings = SettingsModelSchema.parse({
        name: "custom",
        enabled: false,
        require: ["/4K/", "1080p"],
        resolutions: { r2160p: true },
        options: { titleSimilarity: 0.9 },
      });

      // Verify only overridden values
      expect(customSettings.name).toBe("custom");
      expect(customSettings.enabled).toBe(false);
      expect(customSettings.require).toHaveLength(2);
      expect(customSettings.resolutions.r2160p).toBe(true);
      expect(customSettings.options.titleSimilarity).toBe(0.9);
    });
  });
});
