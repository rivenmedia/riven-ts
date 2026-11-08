import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { it as baseIt } from "#__tests__/test-context.ts";
import { DEFAULT_PRESET_SLUG, rankingPresets } from "#ranking/presets/index.ts";
import { RANKING_NAMESPACE } from "#ranking/ranking-settings-section.schema.ts";
import { logger } from "#utilities/logger/logger.ts";

import { syncRankingProfiles } from "../sync-ranking-profiles.actor.ts";

import type { Services } from "#database/database.ts";

const it = baseIt.extend("legacyConfigPath", async ({}, { onCleanup }) => {
  const dir = await mkdtemp(
    path.join(tmpdir(), "riven-sync-ranking-profiles-test-"),
  );

  onCleanup(async () => {
    await rm(dir, { recursive: true });
  });

  return path.join(dir, "riven-ranking-config.json");
});

async function runSync(services: Services, legacyConfigPath: string) {
  await toPromise(
    createActor(syncRankingProfiles, {
      input: {
        rankingProfileService: services.rankingProfileService,
        settingsService: services.settingsService,
        legacyConfigPath,
      },
    }).start(),
  );
}

it("inserts the built-in presets", async ({ services, legacyConfigPath }) => {
  await runSync(services, legacyConfigPath);

  await expect(
    services.rankingProfileService.findBySlug(DEFAULT_PRESET_SLUG),
  ).resolves.toMatchObject({ builtIn: true });
});

it("falls back to default when the active preset was removed", async ({
  services,
  legacyConfigPath,
}) => {
  const { rankingProfileService, settingsService } = services;

  await rankingProfileService.syncPresets([
    ...rankingPresets,
    { slug: "retired", name: "Retired", description: "", config: {} },
  ]);

  const retired = await rankingProfileService.findBySlug("retired");

  await settingsService.writeValues(RANKING_NAMESPACE, {
    upsert: { activeProfileId: retired?.id, excludedPatterns: ["cam"] },
    delete: [],
  });

  const warnSpy = vi.spyOn(logger, "warn");

  await runSync(services, legacyConfigPath);

  await expect(
    settingsService.getStoredValues(RANKING_NAMESPACE),
  ).resolves.toStrictEqual({
    excludedPatterns: ["cam"],
    legacyConfigImported: true,
  });
  expect(warnSpy).toHaveBeenCalledWith(
    'Ranking profile "retired" no longer exists; using the default profile.',
  );
});

it("keeps the active profile when it still exists", async ({
  services,
  legacyConfigPath,
}) => {
  const { rankingProfileService, settingsService } = services;

  const custom = await rankingProfileService.create({
    name: "Mine",
    description: null,
    config: {},
  });

  await settingsService.writeValues(RANKING_NAMESPACE, {
    upsert: { activeProfileId: custom.id },
    delete: [],
  });

  const warnSpy = vi.spyOn(logger, "warn");

  await runSync(services, legacyConfigPath);

  await expect(
    settingsService.getStoredValues(RANKING_NAMESPACE),
  ).resolves.toStrictEqual({
    activeProfileId: custom.id,
    legacyConfigImported: true,
  });
  expect(warnSpy).not.toHaveBeenCalled();
});

it("renames a custom profile that uses a built-in profile's name", async ({
  services,
  legacyConfigPath,
}) => {
  const { rankingProfileService } = services;

  const presetName = rankingPresets[0]?.name ?? "";

  const custom = await rankingProfileService.create({
    name: presetName,
    description: "Mine",
    config: { rankingModel: { av1: 7 } },
  });

  await rankingProfileService.create({
    name: `${presetName} (custom)`,
    description: null,
    config: {},
  });

  const warnSpy = vi.spyOn(logger, "warn");

  await runSync(services, legacyConfigPath);

  await expect(
    rankingProfileService.findById(custom.id),
  ).resolves.toMatchObject({
    name: `${presetName} (custom 2)`,
    description: "Mine",
    builtIn: false,
    rankingModel: { av1: 7 },
  });
  await expect(
    rankingProfileService.findBySlug(DEFAULT_PRESET_SLUG),
  ).resolves.toMatchObject({ name: presetName, builtIn: true });
  expect(warnSpy).toHaveBeenCalledWith(
    `Renamed ranking profile "${presetName}" to "${presetName} (custom 2)" because a built-in profile now uses that name.`,
  );
});

it("imports the legacy config file and logs where it came from", async ({
  services,
  legacyConfigPath,
}) => {
  await writeFile(
    legacyConfigPath,
    JSON.stringify({ rankingModel: "default" }),
    "utf8",
  );

  const warnSpy = vi.spyOn(logger, "warn");

  await runSync(services, legacyConfigPath);

  const defaultProfile =
    await services.rankingProfileService.findBySlug(DEFAULT_PRESET_SLUG);

  await expect(
    services.settingsService.getStoredValues(RANKING_NAMESPACE),
  ).resolves.toStrictEqual({
    activeProfileId: defaultProfile?.id,
    legacyConfigImported: true,
  });
  expect(warnSpy).toHaveBeenCalledWith(
    `Imported ranking config from "${legacyConfigPath}". The file is no longer read and can be deleted.`,
  );
});

it("rejects when the legacy config file is invalid", async ({
  services,
  legacyConfigPath,
}) => {
  await writeFile(legacyConfigPath, "{bad}", "utf8");

  await expect(runSync(services, legacyConfigPath)).rejects.toThrow(
    /Invalid ranking config file/u,
  );
});
