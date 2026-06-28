import { RivenFrontendSettings } from "../riven-frontend-settings.schema.ts";
import { deepFreeze } from "./deep-freeze.ts";

import type { ReadonlyDeep } from "type-fest";

class FrontendSettings {
  readonly settings: ReadonlyDeep<RivenFrontendSettings>;

  constructor(environment: NodeJS.ProcessEnv) {
    const settingPattern = /^RIVEN_FRONTEND_SETTING__(?<setting>.+)$/;

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

    this.settings = deepFreeze(RivenFrontendSettings.parse(rawSettings));
  }
}

export const frontendSettings: ReadonlyDeep<RivenFrontendSettings> =
  new FrontendSettings(process.env).settings;
