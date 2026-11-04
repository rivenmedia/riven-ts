import { CORE_NAMESPACE, RuntimeSettings } from "./core-settings-sections.ts";

import type { InstalledPlugin } from "#types/plugins.ts";
import type { SettingsSectionDefinition } from "./settings-manager.ts";

export interface BuildSettingsSectionsDeps {
  installedPlugins: InstalledPlugin[];
  /** The raw plugin environment settings, keyed by package name. */
  pluginEnvironment: ReadonlyMap<string, Readonly<Record<string, string>>>;
  coreEnvironment: Readonly<Record<string, string>>;
}

/**
 * Builds the editable settings sections: `general`, plus one per installed plugin.
 */
export function buildSettingsSections({
  installedPlugins,
  pluginEnvironment,
  coreEnvironment,
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
