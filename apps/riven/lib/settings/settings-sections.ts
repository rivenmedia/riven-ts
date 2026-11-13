import { getActiveRankingProfile } from "#ranking/get-active-ranking-profile.ts";
import {
  fromRtnSettingsInput,
  RANKING_NAMESPACE,
  RankingSettingsSection,
} from "#ranking/ranking-settings-section.schema.ts";

import { CORE_NAMESPACE, RuntimeSettings } from "./core-settings-sections.ts";
import {
  flattenSettings,
  getLeafDefault,
  getLeafPaths,
} from "./utilities/leaf-paths.ts";

import type { RankingProfileService } from "#database/services/ranking-profile/ranking-profile.service.ts";
import type { SettingsService } from "#database/services/settings/settings.service.ts";
import type { ActiveRankingProfileDeps } from "#ranking/get-active-ranking-profile.ts";
import type { InstalledPlugin } from "#types/plugins.ts";
import type { SettingsSectionDefinition } from "./settings-manager.ts";

export interface BuildSettingsSectionsDeps {
  installedPlugins: InstalledPlugin[];
  /** The raw plugin environment settings, keyed by package name. */
  pluginEnvironment: ReadonlyMap<string, Readonly<Record<string, string>>>;
  coreEnvironment: Readonly<Record<string, string>>;
  rankingProfileService: RankingProfileService;
  settingsService: SettingsService;
}

/** The active ranking profile's settings, flattened over the schema defaults. */
async function resolveRankingDefaults(deps: ActiveRankingProfileDeps) {
  const profile = await getActiveRankingProfile(deps);
  const schemaDefaults: Record<string, unknown> = {};

  for (const leaf of getLeafPaths(RankingSettingsSection).keys()) {
    const value = getLeafDefault(RankingSettingsSection, leaf);

    if (value !== undefined) {
      schemaDefaults[leaf] = value;
    }
  }

  return {
    ...schemaDefaults,
    ...flattenSettings(
      RankingSettingsSection,
      fromRtnSettingsInput(profile.settings),
    ),
  };
}

/**
 * Builds the editable settings sections: `general`, `ranking`, plus one per installed plugin.
 */
export function buildSettingsSections({
  installedPlugins,
  pluginEnvironment,
  coreEnvironment,
  rankingProfileService,
  settingsService,
}: BuildSettingsSectionsDeps): Map<string, SettingsSectionDefinition> {
  const { general } = RuntimeSettings.shape;
  const sections = new Map<string, SettingsSectionDefinition>([
    [
      "general",
      {
        id: "general",
        namespace: CORE_NAMESPACE,
        title: general.meta()?.title ?? "General",
        schema: general,
        environment: coreEnvironment,
      },
    ],
    [
      "ranking",
      {
        id: "ranking",
        namespace: RANKING_NAMESPACE,
        title: "Ranking Settings",
        schema: RankingSettingsSection,
        environment: coreEnvironment,
        hot: true,
        resolveDefaults: () =>
          resolveRankingDefaults({ rankingProfileService, settingsService }),
      },
    ],
  ]);

  for (const { sectionId, packageName, plugin } of installedPlugins) {
    sections.set(sectionId, {
      id: sectionId,
      namespace: packageName,
      title: plugin.settingsSchema.meta()?.title ?? packageName,
      schema: plugin.settingsSchema,
      environment: pluginEnvironment.get(packageName) ?? {},
    });
  }

  return sections;
}
