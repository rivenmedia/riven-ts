import { defaultPreset } from "./default-preset.ts";

import type { RankingProfileConfig } from "../ranking-profile-config.schema.ts";

export interface RankingPreset {
  slug: string;
  name: string;
  description: string;
  config: RankingProfileConfig;
}

export const DEFAULT_PRESET_SLUG = "default";

export const rankingPresets: readonly RankingPreset[] = [
  {
    slug: DEFAULT_PRESET_SLUG,
    name: "Default",
    description: "A balanced profile that prioritises higher-quality releases.",
    config: defaultPreset,
  },
];
