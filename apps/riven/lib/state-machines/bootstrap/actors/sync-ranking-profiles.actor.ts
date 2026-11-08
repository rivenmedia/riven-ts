import path from "node:path";
import { fromPromise } from "xstate";

import { importLegacyRankingConfig } from "#ranking/legacy/import-legacy-ranking-config.ts";
import { rankingPresets } from "#ranking/presets/index.ts";
import { RANKING_NAMESPACE } from "#ranking/ranking-settings-section.schema.ts";
import { logger } from "#utilities/logger/logger.ts";

import type { RankingProfileService } from "#database/services/ranking-profile/ranking-profile.service.ts";
import type { SettingsService } from "#database/services/settings/settings.service.ts";

export interface SyncRankingProfilesInput {
  rankingProfileService: RankingProfileService;
  settingsService: SettingsService;
  legacyConfigPath: string;
}

async function findFreeCustomName(
  rankingProfileService: RankingProfileService,
  name: string,
  reservedNames: ReadonlySet<string>,
) {
  for (let attempt = 1; ; attempt++) {
    const candidate =
      attempt === 1
        ? `${name} (custom)`
        : `${name} (custom ${String(attempt)})`;

    if (
      !reservedNames.has(candidate) &&
      !(await rankingProfileService.nameExists(candidate))
    ) {
      return candidate;
    }
  }
}

/**
 * Profile names are unique, so a custom profile that shares a name with a
 * built-in preset would make the preset sync fail. Rename it out of the way.
 */
async function renameCustomProfilesUsingPresetNames(
  rankingProfileService: RankingProfileService,
) {
  const presetNames = new Set(rankingPresets.map(({ name }) => name));
  const profiles = await rankingProfileService.list();

  for (const profile of profiles) {
    if (profile.builtIn || !presetNames.has(profile.name)) {
      continue;
    }

    const newName = await findFreeCustomName(
      rankingProfileService,
      profile.name,
      presetNames,
    );

    await rankingProfileService.update(profile.id, {
      name: newName,
      description: profile.description,
      config: {
        rankingModel: profile.rankingModel,
        settings: profile.settings,
      },
    });

    logger.warn(
      `Renamed ranking profile "${profile.name}" to "${newName}" because a built-in profile now uses that name.`,
    );
  }
}

async function findActiveProfile({
  rankingProfileService,
  settingsService,
}: SyncRankingProfilesInput) {
  const { activeProfileId } =
    await settingsService.getStoredValues(RANKING_NAMESPACE);

  return typeof activeProfileId === "string"
    ? rankingProfileService.findById(activeProfileId)
    : null;
}

export const syncRankingProfiles = fromPromise<
  undefined,
  SyncRankingProfilesInput
>(async ({ input }) => {
  const { rankingProfileService, settingsService, legacyConfigPath } = input;

  await renameCustomProfilesUsingPresetNames(rankingProfileService);

  const activeProfile = await findActiveProfile(input);
  const { removedSlugs } =
    await rankingProfileService.syncPresets(rankingPresets);

  if (activeProfile?.slug && removedSlugs.includes(activeProfile.slug)) {
    await settingsService.writeValues(RANKING_NAMESPACE, {
      upsert: {},
      delete: ["activeProfileId"],
    });

    logger.warn(
      `Ranking profile "${activeProfile.slug}" no longer exists; using the default profile.`,
    );
  }

  const result = await importLegacyRankingConfig({
    filePath: legacyConfigPath,
    rankingProfileService,
    settingsService,
  });

  if (result === "imported") {
    logger.warn(
      `Imported ranking config from "${path.resolve(legacyConfigPath)}". The file is no longer read and can be deleted.`,
    );
  }
});
