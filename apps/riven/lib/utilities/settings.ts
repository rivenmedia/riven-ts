import { RivenSettings } from "../riven-settings.schema.ts";
import { deepFreeze } from "./deep-freeze.ts";

import type { ReadonlyDeep } from "type-fest";
import type z from "zod";

class Settings {
  readonly settings: ReadonlyDeep<z.infer<typeof RivenSettings>>;

  constructor(environment: NodeJS.ProcessEnv) {
    const settingPattern = /^RIVEN_SETTING__(?<setting>.+)$/;

    const rawSettings: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(environment)) {
      const match = settingPattern.exec(key);

      if (!match?.groups?.["setting"] || !value) {
        continue;
      }

      rawSettings[match.groups["setting"]] = value;

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete environment[key];
    }

    this.settings = deepFreeze(RivenSettings.parse(rawSettings));
  }
}

export const settings: ReadonlyDeep<z.infer<typeof RivenSettings>> =
  new Settings(process.env).settings;
