import { describe, expect, it } from "vitest";

import { resolveEffectiveRankingConfig } from "../resolve-effective-ranking-config.ts";

describe("resolving the effective ranking config", () => {
  it("deep-merges global settings over profile settings", () => {
    const { settings } = resolveEffectiveRankingConfig({
      profile: { settings: { resolutions: { r2160p: true } } },
      globalSettings: { resolutions: { r1080p: false } },
    });

    expect(settings.resolutions).toMatchObject({
      r2160p: true,
      r1080p: false,
      r720p: true,
    });
  });

  it("replaces arrays instead of merging them", () => {
    const { settings } = resolveEffectiveRankingConfig({
      profile: { settings: { exclude: ["a", "b"] } },
      globalSettings: { exclude: [] },
    });

    expect(settings.exclude).toStrictEqual([]);
  });

  it("leaves unset ranks as null (rejected)", () => {
    const { rankingModel } = resolveEffectiveRankingConfig({
      profile: { rankingModel: { av1: 500 } },
      globalSettings: {},
    });

    expect(rankingModel.av1).toBe(500);
    expect(rankingModel.cam).toBeNull();
  });
});
