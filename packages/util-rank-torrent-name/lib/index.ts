// Functions
export { parse } from "./parse.ts";
export { rank, rankTorrent } from "./rank.ts";
export { checkFetch } from "./fetch.ts";
export { createSettings } from "./settings.ts";
export { normalizeTitle } from "./normalize.ts";
export { getLevRatio, titleMatch } from "./lev.ts";

// Types
export type { ParsedData, FetchResult, RankedResult } from "./types.ts";
export type {
  Settings,
  RankingModel,
  CustomRank,
  SettingsInput,
} from "./settings.ts";
export type { Aliases } from "./lev.ts";

// Constants
export { DEFAULT_RANKING, SettingsSchema } from "./settings.ts";
