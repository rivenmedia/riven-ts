import {
  createRankingModel,
  createSettings,
} from "@repo/util-rank-torrent-name";

import { mergeWith } from "es-toolkit";

import type { RankingProfileConfig } from "./ranking-profile-config.schema.ts";
import type { SettingsInput } from "@repo/util-rank-torrent-name";

interface ResolveEffectiveRankingConfigInput {
  profile: RankingProfileConfig;
  globalSettings: SettingsInput;
}

export function resolveEffectiveRankingConfig({
  profile,
  globalSettings,
}: ResolveEffectiveRankingConfigInput) {
  const mergedSettings = mergeWith(
    structuredClone(profile.settings ?? {}),
    globalSettings,
    (_target: unknown, source: unknown) =>
      Array.isArray(source) ? (source as unknown[]) : undefined,
  );

  return {
    rankingModel: createRankingModel(profile.rankingModel),
    settings: createSettings(mergedSettings),
  };
}
