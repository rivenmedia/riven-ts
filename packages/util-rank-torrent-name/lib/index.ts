export { parse, parseFilePath } from "./parser/parse.ts";
export { rank, rankTorrent } from "./ranker/rank.ts";
export { checkFetch } from "./ranker/fetch.ts";
export {
  createSettings,
  createRankingModel,
  Settings,
  SettingsSchema,
  type SettingsInput,
  type RankingModel,
  RankingModelSchema,
} from "./ranker/ranking-settings.schema.ts";
export { normaliseTitle } from "./shared/normalise.ts";
export { getLevRatio, titleMatch, type Aliases } from "./ranker/lev.ts";
export { sortTorrents } from "./ranker/sort.ts";
export { GarbageTorrentError } from "./ranker/exceptions.ts";
export {
  Resolution,
  ResolutionRank,
  ParsedDataSchema,
  type ParsedData,
} from "./schemas.ts";

export type { FetchResult, RankedResult } from "./types.ts";

export { RTN } from "./rtn.ts";
