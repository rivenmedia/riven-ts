import { RTN } from "@repo/util-rank-torrent-name";

import {
  flattenSettings,
  getLeafPaths,
  unflattenSettings,
} from "#settings/utilities/leaf-paths.ts";
import { resolveSettings } from "#settings/utilities/resolve-settings.ts";
import { logger } from "#utilities/logger/logger.ts";

import { getActiveRankingProfile } from "./get-active-ranking-profile.ts";
import {
  RANKING_NAMESPACE,
  RankingSettingsSection,
  toRtnSettingsInput,
} from "./ranking-settings-section.schema.ts";
import { resolveEffectiveRankingConfig } from "./resolve-effective-ranking-config.ts";

import type { ActiveRankingProfileDeps } from "./get-active-ranking-profile.ts";
import type { RankingSettingsSectionInput } from "./ranking-settings-section.schema.ts";

export interface RankingEngineDeps extends ActiveRankingProfileDeps {
  environment: Readonly<Record<string, string>>;
}

let cached: Promise<RTN> | undefined;

async function buildRankingEngine({
  rankingProfileService,
  settingsService,
  environment,
}: RankingEngineDeps): Promise<RTN> {
  const profile = await getActiveRankingProfile({
    rankingProfileService,
    settingsService,
  });
  const stored = await settingsService.getStoredValues(RANKING_NAMESPACE);
  const leaves = getLeafPaths(RankingSettingsSection);

  // Hidden keys (e.g. `activeProfileId`) are not section leaves.
  const storedLeaves = Object.fromEntries(
    Object.entries(stored).filter(([key]) => leaves.has(key)),
  );

  const { value, lockedLeaves, ignoredStored } = resolveSettings({
    schema: RankingSettingsSection,
    stored: storedLeaves,
    env: Object.fromEntries(
      Object.entries(environment).filter(([key]) => leaves.has(key)),
    ),
  });

  for (const { leaf, message } of ignoredStored) {
    logger.warn(
      `Ignoring invalid stored setting "${leaf}" in namespace "${RANKING_NAMESPACE}": ${message}`,
      { namespace: RANKING_NAMESPACE, key: leaf },
    );
  }

  // Only explicitly configured leaves override the profile; schema defaults must not.
  const ignored = new Set(ignoredStored.map(({ leaf }) => leaf));
  const flat = flattenSettings(RankingSettingsSection, value);
  const explicit = Object.fromEntries(
    Object.entries(flat).filter(
      ([leaf]) =>
        lockedLeaves.has(leaf) || (leaf in storedLeaves && !ignored.has(leaf)),
    ),
  );

  const globalSettings = toRtnSettingsInput(
    unflattenSettings(RankingSettingsSection, explicit),
  );

  const { rankingModel, settings } = resolveEffectiveRankingConfig({
    profile: { rankingModel: profile.rankingModel, settings: profile.settings },
    globalSettings,
  });

  return new RTN(rankingModel, settings);
}

/**
 * Returns the ranking engine for the active profile + global ranking settings.
 * Cached until {@link invalidateRankingEngine}; concurrent callers share one build.
 */
export function getRankingEngine(deps: RankingEngineDeps): Promise<RTN> {
  if (!cached) {
    const build = buildRankingEngine(deps);

    cached = build;

    // A failed build must not poison the cache.
    build.catch(() => {
      if (cached === build) {
        cached = undefined;
      }
    });
  }

  return cached;
}

export function invalidateRankingEngine(): void {
  cached = undefined;
}
