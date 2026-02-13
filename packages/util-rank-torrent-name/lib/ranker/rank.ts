import { parse } from "../parser/parse.ts";
import {
  AUDIO_MAP,
  CHANNEL_MAP,
  CODEC_MAP,
  FLAG_MAP,
  HDR_MAP,
  QUALITY_MAP,
} from "../shared/mappings.ts";
import { checkFetch } from "./fetch.ts";
import { DEFAULT_RANKING, getCustomRank } from "./settings.ts";

import type { ParsedData, RankedResult } from "../types.ts";
import type { RankingModel, Settings } from "./settings.ts";

function resolveRank(
  category: string,
  key: string,
  settings: Settings,
  rankingModel: RankingModel,
): number {
  const custom = getCustomRank(settings, category, key);

  if (custom?.rank !== undefined) {
    return custom.rank;
  }

  return rankingModel[key] ?? 0;
}

function rankFromMap(
  value: string | undefined,
  map: Map<string, [string, string]>,
  settings: Settings,
  rankingModel: RankingModel,
): number {
  if (!value) {
    return 0;
  }

  const entry = map.get(value);

  if (!entry) {
    return 0;
  }

  return resolveRank(entry[0], entry[1], settings, rankingModel);
}

function rankFromList(
  values: string[],
  map: Map<string, [string, string]>,
  settings: Settings,
  rankingModel: RankingModel,
): number {
  let total = 0;

  for (const v of values) {
    const entry = map.get(v);

    if (entry) {
      total += resolveRank(entry[0], entry[1], settings, rankingModel);
    }
  }

  return total;
}

function rankFromFlags(
  data: ParsedData,
  flagMap: Map<string, [string, string]>,
  settings: Settings,
  rankingModel: RankingModel,
): number {
  let total = 0;

  for (const [field, [category, key]] of flagMap.entries()) {
    const value = (data as unknown as Record<string, unknown>)[field];

    if (value) {
      total += resolveRank(category, key, settings, rankingModel);
    }
  }

  return total;
}

function calculatePreferred(rawTitle: string, patterns: RegExp[]): number {
  if (patterns.length === 0) {
    return 0;
  }

  return patterns.some((p) => p.test(rawTitle)) ? 10000 : 0;
}

function calculatePreferredLangs(
  languages: string[],
  preferred: string[],
): number {
  if (preferred.length === 0) {
    return 0;
  }

  return languages.some((lang) => preferred.includes(lang)) ? 10000 : 0;
}

export function rank(
  data: ParsedData,
  settings: Settings,
  rankingModel: RankingModel = DEFAULT_RANKING,
): number {
  if (!data.rawTitle) {
    throw new Error("Parsed data cannot have an empty rawTitle.");
  }

  let score = 0;

  // Quality (includes rips and trash quality)
  score += rankFromMap(data.quality, QUALITY_MAP, settings, rankingModel);

  // Codec
  score += rankFromMap(
    data.codec?.toLowerCase(),
    CODEC_MAP,
    settings,
    rankingModel,
  );

  // HDR
  score += rankFromList(data.hdr ?? [], HDR_MAP, settings, rankingModel);

  // Bit depth
  if (data.bitDepth) {
    score += resolveRank("hdr", "bit10", settings, rankingModel);
  }

  // Audio
  score += rankFromList(data.audio ?? [], AUDIO_MAP, settings, rankingModel);

  // Channels
  score += rankFromList(
    data.channels ?? [],
    CHANNEL_MAP,
    settings,
    rankingModel,
  );

  // Boolean flags (extras, trash.size, etc.)
  score += rankFromFlags(data, FLAG_MAP, settings, rankingModel);

  // Preferred patterns (+10000)
  score += calculatePreferred(data.rawTitle, settings.compiledPreferred);

  // Preferred languages (+10000)
  score += calculatePreferredLangs(
    data.languages,
    settings.languages.preferred,
  );

  return score;
}

export function rankTorrent(
  rawTitle: string,
  hash: string,
  settings: Settings,
  rankingModel: RankingModel = DEFAULT_RANKING,
): RankedResult {
  const data = parse(rawTitle);
  const score = rank(data, settings, rankingModel);
  const fetchResult = checkFetch(data, settings);

  return {
    data,
    hash,
    rank: score,
    fetch: fetchResult.fetch,
    failedChecks: fetchResult.failedChecks,
  };
}
