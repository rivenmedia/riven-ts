import { BasePluginSettings } from "../schemas/settings/base-plugin-settings.schema.ts";

export const createPluginSettings: typeof BasePluginSettings.safeExtend =
  BasePluginSettings.safeExtend.bind(null);
