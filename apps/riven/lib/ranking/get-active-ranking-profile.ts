import { DEFAULT_PRESET_SLUG } from "./presets/index.ts";
import { RANKING_NAMESPACE } from "./ranking-settings-section.schema.ts";

import type { RankingProfile } from "#database/entities/ranking-profile.entity.ts";
import type { RankingProfileService } from "#database/services/ranking-profile/ranking-profile.service.ts";
import type { SettingsService } from "#database/services/settings/settings.service.ts";

export interface ActiveRankingProfileDeps {
  rankingProfileService: RankingProfileService;
  settingsService: SettingsService;
}

/**
 * Resolves the active ranking profile from the hidden `activeProfileId` key,
 * falling back to the built-in default preset when unset or no longer present.
 */
export async function getActiveRankingProfile({
  rankingProfileService,
  settingsService,
}: ActiveRankingProfileDeps): Promise<RankingProfile> {
  const stored = await settingsService.getStoredValues(RANKING_NAMESPACE);
  const { activeProfileId } = stored;

  if (typeof activeProfileId === "string") {
    const active = await rankingProfileService.findById(activeProfileId);

    if (active) {
      return active;
    }
  }

  const fallback = await rankingProfileService.findBySlug(DEFAULT_PRESET_SLUG);

  if (!fallback) {
    throw new Error(
      `Default ranking profile "${DEFAULT_PRESET_SLUG}" does not exist`,
    );
  }

  return fallback;
}
