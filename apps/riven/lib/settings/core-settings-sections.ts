import z from "zod";

import { GeneralSettings } from "./sections/general-settings.schema.ts";
import { PluginsSettings } from "./sections/plugins-settings.schema.ts";

/** The settings namespace that owns every core (non-plugin) setting. */
export const CORE_NAMESPACE = "riven";

/** The DB-backed core settings, with one property per section. */
export const RuntimeSettings = z.object({
  general: GeneralSettings,
  plugins: PluginsSettings,
});

export type RuntimeSettings = z.infer<typeof RuntimeSettings>;
