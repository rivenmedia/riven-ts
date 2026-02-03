import { RivenSettings } from "../riven-settings.schema.ts";

import type z from "zod";

class Settings {
  settings: z.infer<typeof RivenSettings>;

  constructor() {
    const settingPattern = /^RIVEN_SETTING__(?<setting>.+)$/;

    const rawSettings: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(process.env)) {
      const match = settingPattern.exec(key);

      if (!match?.groups?.["setting"] || !value) {
        continue;
      }

      rawSettings[match.groups["setting"]] = value;

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env[key];
    }

    this.settings = RivenSettings.parse(rawSettings);
  }
}

export const { settings } = new Settings();
