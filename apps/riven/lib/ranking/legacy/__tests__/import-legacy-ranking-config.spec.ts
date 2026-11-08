import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { DEFAULT_PRESET_SLUG, rankingPresets } from "#ranking/presets/index.ts";
import { RANKING_NAMESPACE } from "#ranking/ranking-settings-section.schema.ts";

import { importLegacyRankingConfig } from "../import-legacy-ranking-config.ts";

const it = baseIt
  .extend("tempDir", async ({}, { onCleanup }) => {
    const dir = await mkdtemp(
      path.join(tmpdir(), "riven-legacy-ranking-config-test-"),
    );

    onCleanup(async () => {
      await rm(dir, { recursive: true });
    });

    return dir;
  })
  .extend("filePath", ({ tempDir }) =>
    path.join(tempDir, "riven-ranking-config.json"),
  )
  .extend("defaultProfileId", async ({ services }) => {
    await services.rankingProfileService.syncPresets(rankingPresets);

    const profile =
      await services.rankingProfileService.findBySlug(DEFAULT_PRESET_SLUG);

    if (!profile) {
      throw new Error("Default preset was not synced");
    }

    return profile.id;
  })
  .extend("deps", ({ filePath, services }) => ({
    filePath,
    rankingProfileService: services.rankingProfileService,
    settingsService: services.settingsService,
  }));

async function writeConfigFile(filePath: string, content: unknown) {
  await writeFile(
    filePath,
    typeof content === "string" ? content : JSON.stringify(content),
    "utf8",
  );
}

describe("when the file names a preset", () => {
  it("selects the preset and writes no overrides for the auto-generated file", async ({
    deps,
    defaultProfileId,
    services: { rankingProfileService, settingsService },
  }) => {
    await writeConfigFile(deps.filePath, {
      $schema: "x",
      rankingModel: "default",
    });

    await expect(importLegacyRankingConfig(deps)).resolves.toBe("imported");

    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toStrictEqual({
      activeProfileId: defaultProfileId,
      legacyConfigImported: true,
    });

    const profiles = await rankingProfileService.list();

    expect(profiles.some(({ name }) => name === "Imported")).toBe(false);
  });

  it("selects the default preset when the ranking model is omitted", async ({
    deps,
    defaultProfileId,
    services: { settingsService },
  }) => {
    await writeConfigFile(deps.filePath, {});

    await expect(importLegacyRankingConfig(deps)).resolves.toBe("imported");

    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toMatchObject({ activeProfileId: defaultProfileId });
  });

  it("puts preset + settings overrides in the global layer", async ({
    deps,
    defaultProfileId,
    services: { settingsService },
  }) => {
    await writeConfigFile(deps.filePath, {
      rankingModel: "default",
      settings: { exclude: ["cam"] },
    });

    await expect(importLegacyRankingConfig(deps)).resolves.toBe("imported");

    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toMatchObject({
      activeProfileId: defaultProfileId,
      excludedPatterns: ["cam"],
    });
  });

  it("keeps the effective settings of the old file, which replaced the preset settings", async ({
    deps,
    defaultProfileId,
    services: { settingsService },
  }) => {
    // The default preset enables 2160p; the old loader discarded preset settings
    // whenever the file had a `settings` object, so 2160p was disabled.
    await writeConfigFile(deps.filePath, {
      rankingModel: "default",
      settings: { exclude: ["cam"], resolutions: { r720p: false } },
    });

    await importLegacyRankingConfig(deps);

    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toStrictEqual({
      activeProfileId: defaultProfileId,
      legacyConfigImported: true,
      excludedPatterns: ["cam"],
      r2160p: false,
      r720p: false,
    });
  });

  it("drops the preset's whole resolutions group when the file sets one resolution", async ({
    deps,
    defaultProfileId,
    services: { settingsService },
  }) => {
    await writeConfigFile(deps.filePath, {
      rankingModel: "default",
      settings: { resolutions: { r1080p: false } },
    });

    await importLegacyRankingConfig(deps);

    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toStrictEqual({
      activeProfileId: defaultProfileId,
      legacyConfigImported: true,
      r1080p: false,
      r2160p: false,
    });
  });
});

describe("when the file holds a custom ranking model", () => {
  it("creates and selects an Imported profile for a custom model", async ({
    deps,
    defaultProfileId: _defaultProfileId,
    services: { rankingProfileService, settingsService },
  }) => {
    await writeConfigFile(deps.filePath, {
      rankingModel: { av1: 1 },
      settings: { exclude: ["x"] },
    });

    await expect(importLegacyRankingConfig(deps)).resolves.toBe("imported");

    const profiles = await rankingProfileService.list();
    const profile = profiles.find(({ name }) => name === "Imported");

    expect(profile).toMatchObject({
      name: "Imported",
      builtIn: false,
      rankingModel: { av1: 1 },
      settings: { exclude: ["x"] },
    });

    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toStrictEqual({
      activeProfileId: profile?.id,
      legacyConfigImported: true,
    });
  });

  it("stores only the values that differ from the RTN defaults", async ({
    deps,
    defaultProfileId: _defaultProfileId,
    services: { rankingProfileService },
  }) => {
    await writeConfigFile(deps.filePath, {
      rankingModel: { av1: 1, avc: null },
      settings: { resolutions: { r1080p: true, r720p: false } },
    });

    await importLegacyRankingConfig(deps);

    const profiles = await rankingProfileService.list();
    const profile = profiles.find(({ name }) => name === "Imported");

    expect(profile?.rankingModel).toStrictEqual({ av1: 1 });
    expect(profile?.settings).toStrictEqual({ resolutions: { r720p: false } });
  });
});

describe("when a custom profile is already named Imported", () => {
  it("creates the imported profile under the next free name", async ({
    deps,
    defaultProfileId: _defaultProfileId,
    services: { rankingProfileService, settingsService },
  }) => {
    const existing = await rankingProfileService.create({
      name: "Imported",
      description: null,
      config: {},
    });

    await writeConfigFile(deps.filePath, { rankingModel: { av1: 1 } });

    await expect(importLegacyRankingConfig(deps)).resolves.toBe("imported");

    const profiles = await rankingProfileService.list();
    const imported = profiles.find(({ name }) => name === "Imported 2");

    expect(imported).toMatchObject({ rankingModel: { av1: 1 } });
    await expect(
      rankingProfileService.findById(existing.id),
    ).resolves.toMatchObject({ name: "Imported", rankingModel: {} });
    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toStrictEqual({
      activeProfileId: imported?.id,
      legacyConfigImported: true,
    });
  });
});

describe("when the import does not apply", () => {
  it("skips when the file is missing", async ({
    deps,
    services: { settingsService },
  }) => {
    await expect(importLegacyRankingConfig(deps)).resolves.toBe(
      "skipped-no-file",
    );

    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toStrictEqual({});
  });

  it("never imports twice", async ({
    deps,
    defaultProfileId: _defaultProfileId,
    services: { rankingProfileService },
  }) => {
    await writeConfigFile(deps.filePath, { rankingModel: { av1: 1 } });

    await expect(importLegacyRankingConfig(deps)).resolves.toBe("imported");
    await expect(importLegacyRankingConfig(deps)).resolves.toBe(
      "skipped-already-imported",
    );

    const profiles = await rankingProfileService.list();

    expect(profiles.filter(({ builtIn }) => !builtIn)).toHaveLength(1);
  });
});

describe("when the file is invalid", () => {
  it("throws on an invalid file", async ({ deps }) => {
    await writeConfigFile(deps.filePath, { rankingModel: { webdl: "high" } });

    await expect(importLegacyRankingConfig(deps)).rejects.toThrow(
      /Invalid ranking config file/u,
    );
  });

  it("includes the file path and the invalid key in the error", async ({
    deps,
  }) => {
    await writeConfigFile(deps.filePath, {
      rankingModel: "default",
      unknownTopLevelKey: true,
    });

    await expect(importLegacyRankingConfig(deps)).rejects.toThrow(
      `Invalid ranking config file at "${deps.filePath}":\n`,
    );
    await expect(importLegacyRankingConfig(deps)).rejects.toThrow(
      'unrecognized key(s) "unknownTopLevelKey"',
    );
  });

  it("throws on invalid JSON", async ({ deps }) => {
    await writeConfigFile(deps.filePath, "{ this is not valid json }");

    await expect(importLegacyRankingConfig(deps)).rejects.toThrow(
      /Invalid JSON/u,
    );
  });

  it("does not mark the config as imported", async ({
    deps,
    services: { settingsService },
  }) => {
    await writeConfigFile(deps.filePath, "{bad}");

    await expect(importLegacyRankingConfig(deps)).rejects.toThrow(
      /Invalid ranking config file/u,
    );

    await expect(
      settingsService.getStoredValues(RANKING_NAMESPACE),
    ).resolves.toStrictEqual({});
  });
});
