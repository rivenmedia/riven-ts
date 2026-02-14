import z from "zod";

import { parse } from "../parser/parse.ts";
import {
  AUDIO_MAP,
  CHANNEL_MAP,
  CODEC_MAP,
  FLAG_MAP,
  HDR_MAP,
  QUALITY_MAP,
} from "../shared/mappings.ts";
import {
  FetchChecksFailedError,
  InvalidHashError,
  RankUnderThresholdError,
  TitleSimilarityError,
} from "./exceptions.ts";
import { checkFetch } from "./fetch.ts";
import { getLevRatio } from "./lev.ts";
import { defaultRankingModel, getCustomRank } from "./settings.ts";

import type { ParsedData } from "../schemas.ts";
import type { RankResult, RankedResult } from "../types.ts";
import type { CustomRanksConfig, RankingModel, Settings } from "./settings.ts";

function resolveRank(
  category: keyof CustomRanksConfig,
  key: keyof RankingModel,
  settings: Settings,
  rankingModel: RankingModel,
): number {
  const custom = getCustomRank(settings, category, key);

  if (custom.rank !== undefined) {
    return custom.rank;
  }

  return rankingModel[key];
}

function rankFromMap(
  value: string | undefined,
  map: Map<string, [keyof CustomRanksConfig, keyof RankingModel]>,
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
  map: Map<string, [keyof CustomRanksConfig, keyof RankingModel]>,
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
  flagMap: Map<string, [keyof CustomRanksConfig, keyof RankingModel]>,
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
  rankingModel: RankingModel,
) {
  if (!data.rawTitle) {
    throw new Error("Parsed data cannot have an empty rawTitle.");
  }

  const scoreParts: Record<string, number> = {};

  // Quality (includes rips and trash quality)
  scoreParts["quality"] = rankFromMap(
    data.quality,
    QUALITY_MAP,
    settings,
    rankingModel,
  );

  // Codec
  scoreParts["codec"] = rankFromMap(
    data.codec?.toLowerCase(),
    CODEC_MAP,
    settings,
    rankingModel,
  );

  // HDR
  scoreParts["hdr"] = rankFromList(
    data.hdr ?? [],
    HDR_MAP,
    settings,
    rankingModel,
  );

  // Bit depth
  if (data.bitDepth) {
    scoreParts["bitDepth"] = resolveRank(
      "hdr",
      "bit10",
      settings,
      rankingModel,
    );
  }

  // Audio
  scoreParts["audio"] = rankFromList(
    data.audio ?? [],
    AUDIO_MAP,
    settings,
    rankingModel,
  );

  // Channels
  scoreParts["channels"] = rankFromList(
    data.channels ?? [],
    CHANNEL_MAP,
    settings,
    rankingModel,
  );

  // Boolean flags (extras, trash.size, etc.)
  scoreParts["flags"] = rankFromFlags(data, FLAG_MAP, settings, rankingModel);

  // Preferred patterns (+10000)
  scoreParts["preferredPatterns"] = calculatePreferred(
    data.rawTitle,
    settings.compiledPreferred,
  );

  // Preferred languages (+10000)
  scoreParts["preferredLanguages"] = calculatePreferredLangs(
    data.languages,
    settings.languages.preferred,
  );

  return {
    totalScore: Object.values(scoreParts).reduce((a, b) => a + b, 0),
    scoreParts,
  } as const satisfies RankResult;
}

const hashSchema = z.hash("sha1");

export function rankTorrent(
  rawTitle: string,
  hash: string,
  correctTitle: string,
  settings: Settings,
  rankingModel: RankingModel = defaultRankingModel,
) {
  const hashValidation = hashSchema.safeParse(hash);

  if (!hashValidation.success) {
    throw new InvalidHashError(rawTitle, hashValidation.error);
  }

  const { titleSimilarity, removeAllTrash, removeRanksUnder } =
    settings.options;
  const data = parse(rawTitle);

  const levRatio = getLevRatio(correctTitle, data.title, titleSimilarity);

  if (removeAllTrash) {
    const levRatioValidation = z
      .number()
      .min(
        titleSimilarity,
        `Title similarity ${levRatio.toString()} is below threshold of ${titleSimilarity.toString()}`,
      )
      .safeParse(levRatio);

    if (!levRatioValidation.success) {
      throw new TitleSimilarityError(rawTitle, levRatioValidation.error);
    }
  }

  const { totalScore, scoreParts } = rank(data, settings, rankingModel);
  const fetchResult = checkFetch(data, settings);

  if (removeAllTrash && !fetchResult.fetch) {
    throw new FetchChecksFailedError(rawTitle, fetchResult.failedChecks);
  }

  if (removeAllTrash && totalScore < removeRanksUnder) {
    throw new RankUnderThresholdError(rawTitle, totalScore, removeRanksUnder);
  }

  return {
    data,
    hash: hashValidation.data,
    scoreParts,
    levRatio,
    rank: totalScore,
    fetch: fetchResult.fetch,
    failedChecks: fetchResult.failedChecks,
  } as const satisfies RankedResult;
}
