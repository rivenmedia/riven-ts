export { parse } from "./parser/parse.ts";
export { rank, rankTorrent } from "./ranker/rank.ts";
export { checkFetch } from "./ranker/fetch.ts";
export { createSettings } from "./ranker/settings.ts";
export { normaliseTitle } from "./shared/normalise.ts";
export { getLevRatio, titleMatch } from "./ranker/lev.ts";

export type { ParsedData, FetchResult, RankedResult } from "./types.ts";
export type {
  Settings,
  RankingModel,
  CustomRank,
  SettingsInput,
} from "./ranker/settings.ts";
export type { Aliases } from "./ranker/lev.ts";

export { DEFAULT_RANKING, SettingsSchema } from "./ranker/settings.ts";

export { RTN } from "./rtn.ts";
