import { describe, expect } from "vitest";

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

describe("rankingProfileService", () => {
  it("syncPresets inserts presets as built-in", async ({
    services: { rankingProfileService },
  }) => {
    await rankingProfileService.syncPresets(rankingPresets);

    const row = await rankingProfileService.findBySlug("default");

    expect(row).toMatchObject({ builtIn: true, name: "Default" });
    expect(row?.rankingModel).toMatchObject({ remux: 10_000 });
  });

  it("syncPresets updates changed preset content in place", async ({
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

  it("syncPresets removes built-ins no longer in code and reports them", async ({
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

  it("syncPresets never touches custom profiles", async ({
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

  it("lists built-ins first, then by name", async ({
    services: { rankingProfileService },
  }) => {
    await rankingProfileService.create({
      name: "Aaa",
      description: null,
      config: {},
    });
    await rankingProfileService.syncPresets(rankingPresets);

    const profiles = await rankingProfileService.list();

    expect(profiles.map((profile) => profile.name)).toStrictEqual([
      "Default",
      "Aaa",
    ]);
  });

  it("updates, checks names and deletes", async ({
    services: { rankingProfileService },
  }) => {
    const created = await rankingProfileService.create({
      name: "One",
      description: null,
      config: {},
    });

    await expect(rankingProfileService.nameExists("One")).resolves.toBe(true);
    await expect(
      rankingProfileService.nameExists("One", created.id),
    ).resolves.toBe(false);

    const updated = await rankingProfileService.update(created.id, {
      name: "Two",
      description: "d",
      config: { rankingModel: { av1: 5 } },
    });

    expect(updated).toMatchObject({
      name: "Two",
      description: "d",
      rankingModel: { av1: 5 },
    });

    await rankingProfileService.delete(created.id);

    await expect(
      rankingProfileService.findById(created.id),
    ).resolves.toBeNull();
  });
});
