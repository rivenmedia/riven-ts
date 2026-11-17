import { describe, expect, it } from "vitest";

import { defaultPreset } from "../presets/default-preset.ts";
import { RankingProfileConfig } from "../ranking-profile-config.schema.ts";

describe("ranking profile config schema", () => {
  it.each([
    [{ rankingModel: { notARank: 1 } }],
    [{ settings: { resolutions: { r9000p: true } } }],
    [{ extra: true }],
  ])("rejects unknown keys %#", (input) => {
    expect(RankingProfileConfig.safeParse(input).success).toBe(false);
  });

  it("does not fill in defaults for omitted keys", () => {
    expect(RankingProfileConfig.parse({})).toStrictEqual({});
    expect(
      RankingProfileConfig.parse({ settings: { options: {} } }),
    ).toStrictEqual({
      settings: { options: {} },
    });
  });

  it("accepts the default preset", () => {
    expect(RankingProfileConfig.parse(defaultPreset)).toStrictEqual(
      defaultPreset,
    );
  });
});
