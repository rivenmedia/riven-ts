import { json } from "@repo/util-plugin-sdk/validation";
import { SettingsSchema } from "@repo/util-rank-torrent-name";

import { isEqual } from "es-toolkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import z from "zod";

import { flattenSettings } from "#settings/utilities/leaf-paths.ts";

import {
  RANKING_NAMESPACE,
  RankingSettingsSection,
  fromRtnSettingsInput,
} from "../ranking-settings-section.schema.ts";
import { sparsifyProfileConfig } from "../sparsify-profile-config.ts";
import { RawRankingConfig } from "./legacy-ranking-config.schema.ts";

import type { RankingProfileService } from "#database/services/ranking-profile/ranking-profile.service.ts";
import type { SettingsService } from "#database/services/settings/settings.service.ts";
import type { SettingsInput } from "@repo/util-rank-torrent-name";

export interface ImportLegacyRankingConfigDeps {
  filePath: string;
  rankingProfileService: RankingProfileService;
  settingsService: SettingsService;
}

export type ImportLegacyRankingConfigResult =
  | "imported"
  | "skipped-no-file"
  | "skipped-already-imported";

const IMPORTED_PROFILE_NAME = "Imported";

async function readConfigFile(resolvedPath: string) {
  try {
    return await readFile(resolvedPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw new Error(
      `Failed to read ranking config file at "${resolvedPath}": ${String(error)}`,
      { cause: error },
    );
  }
}

async function findFreeImportedName(
  rankingProfileService: RankingProfileService,
) {
  for (let attempt = 1; ; attempt++) {
    const candidate =
      attempt === 1
        ? IMPORTED_PROFILE_NAME
        : `${IMPORTED_PROFILE_NAME} ${String(attempt)}`;

    if (!(await rankingProfileService.nameExists(candidate))) {
      return candidate;
    }
  }
}

function toLeafValues(settings: SettingsInput) {
  return flattenSettings(
    RankingSettingsSection,
    fromRtnSettingsInput(SettingsSchema.parse(settings)),
  );
}

/**
 * The old loader replaced the preset's settings with the file's `settings`
 * (defaults included), so the global layer gets every leaf where the file's
 * value differs from the preset's.
 */
function getGlobalOverrides(
  fileSettings: SettingsInput,
  presetSettings: SettingsInput,
) {
  const presetLeaves = toLeafValues(presetSettings);

  return Object.fromEntries(
    Object.entries(toLeafValues(fileSettings)).filter(
      ([leaf, value]) => !isEqual(value, presetLeaves[leaf]),
    ),
  );
}

/**
 * Imports the retired `riven-ranking-config.json` once: a preset name selects
 * that built-in profile (with `settings` going to the global layer), while a
 * custom ranking model becomes a new "Imported" profile holding both.
 */
export async function importLegacyRankingConfig({
  filePath,
  rankingProfileService,
  settingsService,
}: ImportLegacyRankingConfigDeps): Promise<ImportLegacyRankingConfigResult> {
  const stored = await settingsService.getStoredValues(RANKING_NAMESPACE);

  if (stored["legacyConfigImported"] === true) {
    return "skipped-already-imported";
  }

  const resolvedPath = path.resolve(filePath);
  const raw = await readConfigFile(resolvedPath);

  if (raw === null) {
    // Marked as done so a file that appears later never overrides profiles
    // configured in the UI.
    await settingsService.writeValues(RANKING_NAMESPACE, {
      upsert: { legacyConfigImported: true },
      delete: [],
    });

    return "skipped-no-file";
  }

  const parsed = json(RawRankingConfig).safeDecode(raw);

  if (!parsed.success) {
    throw new Error(
      `Invalid ranking config file at "${resolvedPath}":\n${z.prettifyError(parsed.error)}`,
    );
  }

  const { rankingModel, settings } = parsed.data;

  if (typeof rankingModel === "string") {
    const preset = await rankingProfileService.findBySlug(rankingModel);

    if (!preset) {
      throw new Error(`Ranking profile "${rankingModel}" does not exist`);
    }

    await settingsService.writeValues(RANKING_NAMESPACE, {
      upsert: {
        ...(settings ? getGlobalOverrides(settings, preset.settings) : {}),
        activeProfileId: preset.id,
        legacyConfigImported: true,
      },
      delete: [],
    });

    return "imported";
  }

  // Created before the marker is written, so a crash in between only leaves an
  // unused profile; the next boot imports again under a free name.
  const profile = await rankingProfileService.create({
    name: await findFreeImportedName(rankingProfileService),
    description: `Imported from "${resolvedPath}".`,
    config: sparsifyProfileConfig({ rankingModel, settings }),
  });

  await settingsService.writeValues(RANKING_NAMESPACE, {
    upsert: { activeProfileId: profile.id, legacyConfigImported: true },
    delete: [],
  });

  return "imported";
}
