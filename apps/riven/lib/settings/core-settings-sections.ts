import { GeneralSettings } from "./sections/general-settings.schema.ts";
import { PluginsSettings } from "./sections/plugins-settings.schema.ts";

import type { z } from "zod";

/** The settings namespace that owns every core (non-plugin) setting. */
export const CORE_NAMESPACE = "riven";

/** The DB-backed core settings sections, keyed by section id. */
export const coreSettingsSections = {
  general: GeneralSettings,
  plugins: PluginsSettings,
} as const;

export type RuntimeSettings = {
  [K in keyof typeof coreSettingsSections]: z.infer<
    (typeof coreSettingsSections)[K]
  >;
};
