import { describe, expect, it } from "vitest";

import { sparsifyProfileConfig } from "../sparsify-profile-config.ts";

describe("sparsifying a profile config", () => {
  it("drops values equal to RTN defaults", () => {
    expect(
      sparsifyProfileConfig({
        rankingModel: { av1: 500, cam: null },
        settings: {
          resolutions: { r1080p: true, r2160p: true },
          options: { titleSimilarity: 0.85 },
        },
      }),
    ).toStrictEqual({
      rankingModel: { av1: 500 },
      settings: { resolutions: { r2160p: true } },
    });
  });

  it("returns {} for an all-default config", () => {
    expect(
      sparsifyProfileConfig({ rankingModel: {}, settings: {} }),
    ).toStrictEqual({});
  });

  it("keeps non-empty arrays and drops empty ones", () => {
    expect(
      sparsifyProfileConfig({ settings: { exclude: ["x"], require: [] } }),
    ).toStrictEqual({ settings: { exclude: ["x"] } });
  });
});
