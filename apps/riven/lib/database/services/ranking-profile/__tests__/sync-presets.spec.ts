import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { DEFAULT_PRESET_SLUG, rankingPresets } from "#ranking/presets/index.ts";

const defaultPreset = rankingPresets.find(
  (preset) => preset.slug === DEFAULT_PRESET_SLUG,
) ?? {
  slug: DEFAULT_PRESET_SLUG,
  name: "Default",
  description: "",
  config: {},
};

it("inserts presets as built-in", async ({
  services: { rankingProfileService },
}) => {
  await rankingProfileService.syncPresets(rankingPresets);

  const row = await rankingProfileService.findBySlug("default");

  expect(row).toMatchObject({ builtIn: true, name: "Default" });
  expect(row?.rankingModel).toMatchObject({ remux: 10_000 });
});

it("updates changed preset content in place", async ({
  services: { rankingProfileService },
}) => {
  await rankingProfileService.syncPresets(rankingPresets);

  const original = await rankingProfileService.findBySlug("default");

  await rankingProfileService.syncPresets([
    { ...defaultPreset, config: { rankingModel: { av1: 1 } } },
  ]);

  await expect(
    rankingProfileService.findBySlug("default"),
  ).resolves.toMatchObject({
    id: original?.id,
    rankingModel: { av1: 1 },
  });
});

it("removes built-ins no longer in code and reports them", async ({
  services: { rankingProfileService },
}) => {
  await rankingProfileService.syncPresets([
    ...rankingPresets,
    { slug: "old", name: "Old", description: "", config: {} },
  ]);

  await expect(
    rankingProfileService.syncPresets(rankingPresets),
  ).resolves.toStrictEqual({ removedSlugs: ["old"] });
  await expect(rankingProfileService.findBySlug("old")).resolves.toBeNull();
});

it("never touches custom profiles", async ({
  services: { rankingProfileService },
}) => {
  const custom = await rankingProfileService.create({
    name: "Mine",
    description: null,
    config: {},
  });

  await rankingProfileService.syncPresets(rankingPresets);

  await expect(
    rankingProfileService.findById(custom.id),
  ).resolves.not.toBeNull();
});
