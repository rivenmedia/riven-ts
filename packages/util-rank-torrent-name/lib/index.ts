/**
 * RTN - Rank Torrent Name
 *
 * A TypeScript library for parsing and ranking torrent titles based on user preferences.
 *
 * @example
 * ```typescript
 * import { RTN, createDefaultSettings, createDefaultRanking } from "rank-torrent-name";
 *
 * const settings = createDefaultSettings();
 * const ranking = createDefaultRanking();
 * const rtn = new RTN(settings, ranking);
 *
 * const torrent = rtn.rank(
 *   "Inception (2010) (2160p HDR BDRip x265 10bit DTS-HD MA 5.1 - r0b0t) [TAoE].mkv",
 *   "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7"
 * );
 *
 * console.log(torrent.rank);          // Computed rank
 * console.log(torrent.data.quality);  // "BDRip"
 * console.log(torrent.data.codec);    // "HEVC"
 * console.log(torrent.fetch);         // true/false based on settings
 * ```
 */

// Main class
export { RTN, parse } from "./parser.ts";

// Models and schemas
export {
  // Parsed data
  ParsedDataSchema,
  type ParsedData,
  getParsedDataType,

  // Ranking models
  BaseRankingModelSchema,
  type BaseRankingModel,
  DefaultRankingSchema,
  type DefaultRanking,
  createDefaultRanking,

  // Custom rank
  CustomRankSchema,
  type CustomRank,

  // Config schemas
  ResolutionConfigSchema,
  type ResolutionConfig,
  OptionsConfigSchema,
  type OptionsConfig,
  LanguagesConfigSchema,
  type LanguagesConfig,

  // Custom ranks config
  QualityRankModelSchema,
  type QualityRankModel,
  RipsRankModelSchema,
  type RipsRankModel,
  HdrRankModelSchema,
  type HdrRankModel,
  AudioRankModelSchema,
  type AudioRankModel,
  ExtrasRankModelSchema,
  type ExtrasRankModel,
  TrashRankModelSchema,
  type TrashRankModel,
  CustomRanksConfigSchema,
  type CustomRanksConfig,

  // Settings
  SettingsModelSchema,
  type SettingsModel,
  compileSettingsPatterns,
  createDefaultSettings,

  // Torrent
  TorrentSchema,
  type Torrent,
  createTorrent,
} from "./models.ts";

// Ranking functions
export {
  getRank,
  calculatePreferred,
  calculatePreferredLangs,
  calculateQualityRank,
  calculateCodecRank,
  calculateHdrRank,
  calculateAudioRank,
  calculateChannelsRank,
  calculateExtraRanks,
} from "./ranker.ts";

// Fetch/filter functions
export { checkFetch, type FetchResult } from "./fetch.ts";

// Pattern utilities
export { normalizeTitle, checkPattern } from "./patterns.ts";

// Extra utilities
export {
  Resolution,
  getResolution,
  titleMatch,
  getLevRatio,
  sortTorrents,
  extractSeasons,
  extractEpisodes,
  episodesFromSeason,
} from "./extras.ts";

// Exceptions
export { GarbageTorrent, SettingsDisabled } from "./exceptions.ts";
