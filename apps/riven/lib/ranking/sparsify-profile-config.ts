import {
  SettingsSchema,
  createRankingModel,
} from "@repo/util-rank-torrent-name";

import { isEqual, isPlainObject } from "es-toolkit";

import type { RankingProfileConfig } from "./ranking-profile-config.schema.ts";

function sparsify(value: unknown, defaults: unknown): unknown {
  if (!isPlainObject(value)) {
    return isEqual(value, defaults) ? undefined : value;
  }

  const defaultsRecord = isPlainObject(defaults) ? defaults : {};
  const result: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    const sparseChild = sparsify(child, defaultsRecord[key]);

    if (sparseChild !== undefined) {
      result[key] = sparseChild;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Removes every value that equals the RTN default, then removes empty objects,
 * so only meaningful overrides are stored.
 */
export function sparsifyProfileConfig(
  config: RankingProfileConfig,
): RankingProfileConfig {
  const result: RankingProfileConfig = {};

  const rankingModel = sparsify(config.rankingModel, createRankingModel());
  const settings = sparsify(config.settings, SettingsSchema.parse({}));

  if (rankingModel) {
    result.rankingModel = rankingModel;
  }

  if (settings) {
    result.settings = settings;
  }

  return result;
}
