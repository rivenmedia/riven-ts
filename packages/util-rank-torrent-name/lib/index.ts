export { parse } from "./parser/parse.ts";
export { rank, rankTorrent } from "./ranker/rank.ts";
export { checkFetch } from "./ranker/fetch.ts";
export { createSettings, createRankingModel } from "./ranker/settings.ts";
export { normaliseTitle } from "./shared/normalise.ts";
export { getLevRatio, titleMatch } from "./ranker/lev.ts";
export { sortTorrents } from "./ranker/sort.ts";
export { GarbageTorrentError } from "./ranker/exceptions.ts";
export { Resolution } from "./schemas.ts";

export type { FetchResult, RankedResult } from "./types.ts";
export type { ParsedData } from "./schemas.ts";
export type {
  Settings,
  RankingModel,
  CustomRank,
  SettingsInput,
} from "./ranker/settings.ts";
export type { Aliases } from "./ranker/lev.ts";

export { defaultRankingModel, SettingsSchema } from "./ranker/settings.ts";

export { RTN } from "./rtn.ts";
