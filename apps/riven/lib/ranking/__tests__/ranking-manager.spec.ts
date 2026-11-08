import { GraphQLError } from "graphql";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import { DEFAULT_PRESET_SLUG, rankingPresets } from "../presets/index.ts";
import { invalidateRankingEngine } from "../ranking-engine.ts";
import { RankingManager } from "../ranking-manager.ts";
import { toProfileFormValues } from "../ranking-profile-form.ts";
import { RANKING_NAMESPACE } from "../ranking-settings-section.schema.ts";

vi.mock(import("../ranking-engine.ts"), { spy: true });

const BUILT_IN_ISSUE = {
  path: "",
  message: "Built-in profiles can't be changed. Duplicate it to customise.",
};

const it = baseIt
  .extend("manager", ({ services }) => new RankingManager(services))
  .extend("defaultId", async ({ services: { rankingProfileService } }) => {
    const profile = await rankingProfileService.findBySlug(DEFAULT_PRESET_SLUG);

    if (!profile) {
      throw new Error("Default preset missing");
    }

    return profile.id;
  });

const formValues = (name: string, rankingModel = {}) =>
  toProfileFormValues({ name, description: null, rankingModel, settings: {} });

async function listProfiles(manager: RankingManager) {
  const profiles = await manager.list();

  return {
    profiles,
    names: profiles.map(({ name }) => name),
    activeNames: profiles
      .filter(({ isActive }) => isActive)
      .map(({ name }) => name),
  };
}

/** Creates a custom profile and returns its id. */
async function createProfile(
  manager: RankingManager,
  name: string,
  rankingModel = {},
) {
  await manager.create(formValues(name, rankingModel));

  const { profiles } = await listProfiles(manager);
  const profile = profiles.find((candidate) => candidate.name === name);

  if (!profile) {
    throw new Error(`Profile "${name}" was not created`);
  }

  return profile.id;
}

it.beforeEach(async ({ services: { rankingProfileService } }) => {
  await rankingProfileService.syncPresets(rankingPresets);

  vi.mocked(invalidateRankingEngine).mockClear();
});

it("lists presets first and marks the active profile", async ({
  manager,
  services: { rankingProfileService },
}) => {
  await manager.create(formValues("Aaa", { av1: 1 }));

  const profiles = await manager.list();

  expect(
    profiles.map(({ name, isActive }) => ({ name, isActive })),
  ).toStrictEqual([
    { name: "Default", isActive: true },
    { name: "Aaa", isActive: false },
  ]);

  const custom = await rankingProfileService.findBySlug(DEFAULT_PRESET_SLUG);

  expect(profiles[0]).toMatchObject({
    id: custom?.id,
    slug: DEFAULT_PRESET_SLUG,
    builtIn: true,
    rankingModel: { remux: 10_000 },
  });
  expect(profiles[1]).toMatchObject({
    slug: null,
    builtIn: false,
    description: null,
    rankingModel: { av1: 1 },
    settings: {},
    values: {
      name: "Aaa",
      ranks: { quality: { av1: { fetch: true, rank: 1 } } },
    },
  });
});

it("marks the selected profile active", async ({ manager }) => {
  const mine = await createProfile(manager, "Mine");

  await expect(manager.select(mine)).resolves.toStrictEqual([]);
  await expect(listProfiles(manager)).resolves.toMatchObject({
    activeNames: ["Mine"],
  });
});

it("serves the profile form JSON schema", ({ manager }) => {
  expect(manager.getSchema()).toMatchObject({
    type: "object",
    properties: { ranks: { type: "object" } },
  });
});

it("refuses to update or delete a built-in", async ({ manager, defaultId }) => {
  await expect(
    manager.update(defaultId, formValues("Renamed")),
  ).resolves.toStrictEqual([BUILT_IN_ISSUE]);
  await expect(manager.delete(defaultId)).resolves.toStrictEqual([
    BUILT_IN_ISSUE,
  ]);
  await expect(listProfiles(manager)).resolves.toMatchObject({
    names: ["Default"],
  });
});

it("refuses to delete the active profile", async ({ manager }) => {
  const mine = await createProfile(manager, "Mine");

  await manager.select(mine);

  await expect(manager.delete(mine)).resolves.toStrictEqual([
    {
      path: "",
      message:
        "The active profile can't be deleted. Select another profile first.",
    },
  ]);
});

it("deletes an inactive custom profile", async ({ manager }) => {
  const mine = await createProfile(manager, "Mine");

  await expect(manager.delete(mine)).resolves.toStrictEqual([]);
  await expect(listProfiles(manager)).resolves.toMatchObject({
    names: ["Default"],
  });
});

it("rejects a duplicate name", async ({ manager }) => {
  const nameTaken = {
    path: "name",
    message: "A profile with this name already exists.",
  };

  await expect(manager.create(formValues("Default"))).resolves.toStrictEqual([
    nameTaken,
  ]);

  await createProfile(manager, "One");

  const two = await createProfile(manager, "Two");

  await expect(manager.update(two, formValues("One"))).resolves.toStrictEqual([
    nameTaken,
  ]);
  await expect(
    manager.update(two, formValues("Two", { av1: 3 })),
  ).resolves.toStrictEqual([]);
});

it("returns form issues without writing", async ({ manager }) => {
  const issues = await manager.create({ ...formValues("Bad"), name: "" });

  expect(issues.map(({ path }) => path)).toStrictEqual(["name"]);
  await expect(listProfiles(manager)).resolves.toMatchObject({
    names: ["Default"],
  });
});

it("duplicates with unique copy names", async ({ manager, defaultId }) => {
  await expect(manager.duplicate(defaultId)).resolves.toStrictEqual([]);
  await expect(manager.duplicate(defaultId)).resolves.toStrictEqual([]);

  const { profiles, names } = await listProfiles(manager);

  expect(new Set(names)).toStrictEqual(
    new Set(["Default", "Default (copy)", "Default (copy 2)"]),
  );
  expect(profiles.find(({ name }) => name === "Default (copy)")).toMatchObject({
    builtIn: false,
    slug: null,
    description: profiles[0]?.description,
    rankingModel: profiles[0]?.rankingModel,
    settings: profiles[0]?.settings,
  });
});

it("stores profiles sparsely", async ({
  manager,
  services: { rankingProfileService },
}) => {
  await manager.create(formValues("Blank"));

  const profiles = await rankingProfileService.list();
  const blank = profiles.find(({ name }) => name === "Blank");

  expect(blank?.rankingModel).toStrictEqual({});
  expect(blank?.settings).toStrictEqual({});
});

it("throws NOT_FOUND for an unknown id", async ({ manager }) => {
  const id = crypto.randomUUID();
  const notFound = expect.objectContaining({
    constructor: GraphQLError,
    extensions: { code: "NOT_FOUND" },
  });

  await expect(manager.update(id, formValues("X"))).rejects.toStrictEqual(
    notFound,
  );
  await expect(manager.delete(id)).rejects.toStrictEqual(notFound);
  await expect(manager.duplicate(id)).rejects.toStrictEqual(notFound);
  await expect(manager.select(id)).rejects.toStrictEqual(notFound);
});

it("invalidates the engine when the active profile changes", async ({
  manager,
  services: { settingsService },
}) => {
  const mine = await createProfile(manager, "Mine");

  await manager.select(mine);

  expect(invalidateRankingEngine).toHaveBeenCalledOnce();
  await expect(
    settingsService.getStoredValues(RANKING_NAMESPACE),
  ).resolves.toMatchObject({ activeProfileId: mine });

  vi.mocked(invalidateRankingEngine).mockClear();

  await manager.update(mine, formValues("Mine", { av1: 7 }));

  expect(invalidateRankingEngine).toHaveBeenCalledOnce();
});

it("does not invalidate when editing an inactive profile", async ({
  manager,
}) => {
  const mine = await createProfile(manager, "Mine");

  await manager.update(mine, formValues("Mine", { av1: 7 }));
  await manager.duplicate(mine);
  await manager.delete(mine);

  expect(invalidateRankingEngine).not.toHaveBeenCalled();
});
