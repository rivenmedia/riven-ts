/**
 * Zod schemas and TypeScript types for the RTN package.
 * These mirror the Python Pydantic models.
 */
import { z } from "zod";

// ============================================================================
// ParsedData Schema
// ============================================================================

/**
 * Parsed data model for a torrent title.
 */
export const ParsedDataSchema = z.object({
  rawTitle: z.string(),
  parsedTitle: z.string().default(""),
  normalizedTitle: z.string().default(""),
  trash: z.boolean().default(false),
  adult: z.boolean().default(false),
  year: z.int().nullable().default(null),
  resolution: z.string().default("unknown"),
  seasons: z.array(z.int()).default([]),
  episodes: z.array(z.int()).default([]),
  complete: z.boolean().default(false),
  volumes: z.array(z.int()).default([]),
  languages: z.array(z.string()).default([]),
  quality: z.string().nullable().default(null),
  hdr: z.array(z.string()).default([]),
  codec: z.string().nullable().default(null),
  audio: z.array(z.string()).default([]),
  channels: z.array(z.string()).default([]),
  dubbed: z.boolean().default(false),
  subbed: z.boolean().default(false),
  date: z.string().nullable().default(null),
  group: z.string().nullable().default(null),
  edition: z.string().nullable().default(null),
  bitDepth: z.string().nullable().default(null),
  bitrate: z.string().nullable().default(null),
  network: z.string().nullable().default(null),
  extended: z.boolean().default(false),
  converted: z.boolean().default(false),
  hardcoded: z.boolean().default(false),
  region: z.string().nullable().default(null),
  ppv: z.boolean().default(false),
  is3d: z.boolean().default(false),
  site: z.string().nullable().default(null),
  size: z.string().nullable().default(null),
  proper: z.boolean().default(false),
  repack: z.boolean().default(false),
  retail: z.boolean().default(false),
  upscaled: z.boolean().default(false),
  remastered: z.boolean().default(false),
  unrated: z.boolean().default(false),
  uncensored: z.boolean().default(false),
  documentary: z.boolean().default(false),
  commentary: z.boolean().default(false),
  episodeCode: z.string().nullable().default(null),
  country: z.string().nullable().default(null),
  container: z.string().nullable().default(null),
  extension: z.string().nullable().default(null),
  extras: z.array(z.string()).default([]),
  torrent: z.boolean().default(false),
  scene: z.boolean().default(false),
});

export type ParsedData = z.infer<typeof ParsedDataSchema>;

/**
 * Get the type of the torrent based on its attributes.
 */
export function getParsedDataType(data: ParsedData): "movie" | "show" {
  if (data.seasons.length === 0 && data.episodes.length === 0) {
    return "movie";
  }
  return "show";
}

// ============================================================================
// BaseRankingModel Schema
// ============================================================================

/**
 * Base ranking model with default values of 0.
 */
export const BaseRankingModelSchema = z.object({
  // quality
  av1: z.int().default(0),
  avc: z.int().default(0),
  bluray: z.int().default(0),
  dvd: z.int().default(0),
  hdtv: z.int().default(0),
  hevc: z.int().default(0),
  mpeg: z.int().default(0),
  remux: z.int().default(0),
  vhs: z.int().default(0),
  web: z.int().default(0),
  webdl: z.int().default(0),
  webmux: z.int().default(0),
  xvid: z.int().default(0),
  pdtv: z.int().default(0),

  // rips
  bdrip: z.int().default(0),
  brrip: z.int().default(0),
  dvdrip: z.int().default(0),
  hdrip: z.int().default(0),
  ppvrip: z.int().default(0),
  tvrip: z.int().default(0),
  uhdrip: z.int().default(0),
  vhsrip: z.int().default(0),
  webdlrip: z.int().default(0),
  webrip: z.int().default(0),
  satrip: z.int().default(0),

  // hdr
  bit10: z.int().default(0),
  dolbyVision: z.int().default(0),
  hdr: z.int().default(0),
  hdr10plus: z.int().default(0),
  sdr: z.int().default(0),

  // audio
  aac: z.int().default(0),
  atmos: z.int().default(0),
  dolbyDigital: z.int().default(0),
  dolbyDigitalPlus: z.int().default(0),
  dtsLossy: z.int().default(0),
  dtsLossless: z.int().default(0),
  flac: z.int().default(0),
  mono: z.int().default(0),
  mp3: z.int().default(0),
  stereo: z.int().default(0),
  surround: z.int().default(0),
  truehd: z.int().default(0),

  // extras
  three_d: z.int().default(0),
  converted: z.int().default(0),
  documentary: z.int().default(0),
  commentary: z.int().default(0),
  uncensored: z.int().default(0),
  dubbed: z.int().default(0),
  edition: z.int().default(0),
  hardcoded: z.int().default(0),
  network: z.int().default(0),
  proper: z.int().default(0),
  repack: z.int().default(0),
  retail: z.int().default(0),
  subbed: z.int().default(0),
  upscaled: z.int().default(0),
  scene: z.int().default(0),

  // trash
  cam: z.int().default(0),
  cleanAudio: z.int().default(0),
  r5: z.int().default(0),
  screener: z.int().default(0),
  site: z.int().default(0),
  size: z.int().default(0),
  telecine: z.int().default(0),
  telesync: z.int().default(0),
});

export type BaseRankingModel = z.infer<typeof BaseRankingModelSchema>;

/**
 * Default ranking model preset that covers the highest qualities like 4K HDR.
 */
export const DefaultRankingSchema = BaseRankingModelSchema.extend({
  // quality
  av1: z.int().default(500),
  avc: z.int().default(500),
  bluray: z.int().default(100),
  dvd: z.int().default(-5000),
  hdtv: z.int().default(-5000),
  hevc: z.int().default(500),
  mpeg: z.int().default(-1000),
  remux: z.int().default(10000),
  vhs: z.int().default(-10000),
  web: z.int().default(100),
  webdl: z.int().default(200),
  webmux: z.int().default(-10000),
  xvid: z.int().default(-10000),
  pdtv: z.int().default(-10000),

  // rips
  bdrip: z.int().default(-5000),
  brrip: z.int().default(-10000),
  dvdrip: z.int().default(-5000),
  hdrip: z.int().default(-10000),
  ppvrip: z.int().default(-10000),
  tvrip: z.int().default(-10000),
  uhdrip: z.int().default(-5000),
  vhsrip: z.int().default(-10000),
  webdlrip: z.int().default(-10000),
  webrip: z.int().default(-1000),

  // hdr
  bit10: z.int().default(100),
  dolbyVision: z.int().default(3000),
  hdr: z.int().default(2000),
  hdr10plus: z.int().default(2100),

  // audio
  aac: z.int().default(100),
  atmos: z.int().default(1000),
  dolbyDigital: z.int().default(50),
  dolbyDigitalPlus: z.int().default(150),
  dtsLossy: z.int().default(100),
  dtsLossless: z.int().default(2000),
  mp3: z.int().default(-1000),
  truehd: z.int().default(2000),

  // extras
  three_d: z.int().default(-10000),
  converted: z.int().default(-1000),
  documentary: z.int().default(-250),
  dubbed: z.int().default(-1000),
  edition: z.int().default(100),
  proper: z.int().default(20),
  repack: z.int().default(20),
  site: z.int().default(-10000),
  upscaled: z.int().default(-10000),

  // trash
  cam: z.int().default(-10000),
  cleanAudio: z.int().default(-10000),
  r5: z.int().default(-10000),
  satrip: z.int().default(-10000),
  screener: z.int().default(-10000),
  size: z.int().default(-10000),
  telecine: z.int().default(-10000),
  telesync: z.int().default(-10000),
});

export type DefaultRanking = z.infer<typeof DefaultRankingSchema>;

/**
 * Create a default ranking model instance.
 */
export function createDefaultRanking(): BaseRankingModel {
  return DefaultRankingSchema.parse({});
}

// ============================================================================
// CustomRank Schema
// ============================================================================

/**
 * Custom Rank model used in SettingsModel.
 */
export const CustomRankSchema = z.object({
  fetch: z.boolean().default(true),
  useCustomRank: z.boolean().default(false),
  rank: z.int().default(0),
});

export type CustomRank = z.infer<typeof CustomRankSchema>;

// ============================================================================
// Settings Config Schemas
// ============================================================================

/**
 * Configuration for which resolutions are enabled.
 */
export const ResolutionConfigSchema = z.object({
  r2160p: z.boolean().default(false),
  r1080p: z.boolean().default(true),
  r720p: z.boolean().default(true),
  r480p: z.boolean().default(false),
  r360p: z.boolean().default(false),
  unknown: z.boolean().default(true),
});

export type ResolutionConfig = z.infer<typeof ResolutionConfigSchema>;

/**
 * Configuration for various options.
 */
export const OptionsConfigSchema = z.object({
  titleSimilarity: z.number().min(0).max(1).default(0.85),
  removeAllTrash: z.boolean().default(true),
  removeRanksUnder: z.int().default(-10000),
  removeUnknownLanguages: z.boolean().default(false),
  allowEnglishInLanguages: z.boolean().default(true),
  enableFetchSpeedMode: z.boolean().default(true),
  removeAdultContent: z.boolean().default(true),
});

export type OptionsConfig = z.infer<typeof OptionsConfigSchema>;

/**
 * Configuration for which languages are enabled.
 */
export const LanguagesConfigSchema = z.object({
  required: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  preferred: z.array(z.string()).default([]),
});

export type LanguagesConfig = z.infer<typeof LanguagesConfigSchema>;

// ============================================================================
// Custom Ranks Config Schemas
// ============================================================================

/**
 * Ranking configuration for quality attributes.
 */
export const QualityRankModelSchema = z.object({
  av1: CustomRankSchema.prefault({ fetch: false }),
  avc: CustomRankSchema.prefault({ fetch: true }),
  bluray: CustomRankSchema.prefault({ fetch: true }),
  dvd: CustomRankSchema.prefault({ fetch: false }),
  hdtv: CustomRankSchema.prefault({ fetch: true }),
  hevc: CustomRankSchema.prefault({ fetch: true }),
  mpeg: CustomRankSchema.prefault({ fetch: false }),
  remux: CustomRankSchema.prefault({ fetch: false }),
  vhs: CustomRankSchema.prefault({ fetch: false }),
  web: CustomRankSchema.prefault({ fetch: true }),
  webdl: CustomRankSchema.prefault({ fetch: true }),
  webmux: CustomRankSchema.prefault({ fetch: false }),
  xvid: CustomRankSchema.prefault({ fetch: false }),
});

export type QualityRankModel = z.infer<typeof QualityRankModelSchema>;

/**
 * Ranking configuration for rips attributes.
 */
export const RipsRankModelSchema = z.object({
  bdrip: CustomRankSchema.prefault({ fetch: false }),
  brrip: CustomRankSchema.prefault({ fetch: true }),
  dvdrip: CustomRankSchema.prefault({ fetch: false }),
  hdrip: CustomRankSchema.prefault({ fetch: true }),
  ppvrip: CustomRankSchema.prefault({ fetch: false }),
  satrip: CustomRankSchema.prefault({ fetch: false }),
  tvrip: CustomRankSchema.prefault({ fetch: false }),
  uhdrip: CustomRankSchema.prefault({ fetch: false }),
  vhsrip: CustomRankSchema.prefault({ fetch: false }),
  webdlrip: CustomRankSchema.prefault({ fetch: false }),
  webrip: CustomRankSchema.prefault({ fetch: true }),
});

export type RipsRankModel = z.infer<typeof RipsRankModelSchema>;

/**
 * Ranking configuration for HDR attributes.
 */
export const HdrRankModelSchema = z.object({
  bit10: CustomRankSchema.prefault({ fetch: true }),
  dolbyVision: CustomRankSchema.prefault({ fetch: false }),
  hdr: CustomRankSchema.prefault({ fetch: true }),
  hdr10plus: CustomRankSchema.prefault({ fetch: true }),
  sdr: CustomRankSchema.prefault({ fetch: true }),
});

export type HdrRankModel = z.infer<typeof HdrRankModelSchema>;

/**
 * Ranking configuration for audio attributes.
 */
export const AudioRankModelSchema = z.object({
  aac: CustomRankSchema.prefault({ fetch: true }),
  atmos: CustomRankSchema.prefault({ fetch: true }),
  dolbyDigital: CustomRankSchema.prefault({ fetch: true }),
  dolbyDigitalPlus: CustomRankSchema.prefault({ fetch: true }),
  dtsLossy: CustomRankSchema.prefault({ fetch: true }),
  dtsLossless: CustomRankSchema.prefault({ fetch: true }),
  flac: CustomRankSchema.prefault({ fetch: true }),
  mono: CustomRankSchema.prefault({ fetch: false }),
  mp3: CustomRankSchema.prefault({ fetch: false }),
  stereo: CustomRankSchema.prefault({ fetch: true }),
  surround: CustomRankSchema.prefault({ fetch: true }),
  truehd: CustomRankSchema.prefault({ fetch: true }),
});

export type AudioRankModel = z.infer<typeof AudioRankModelSchema>;

/**
 * Ranking configuration for extras attributes.
 */
export const ExtrasRankModelSchema = z.object({
  three_d: CustomRankSchema.prefault({ fetch: false }),
  converted: CustomRankSchema.prefault({ fetch: false }),
  documentary: CustomRankSchema.prefault({ fetch: false }),
  dubbed: CustomRankSchema.prefault({ fetch: true }),
  edition: CustomRankSchema.prefault({ fetch: true }),
  hardcoded: CustomRankSchema.prefault({ fetch: true }),
  network: CustomRankSchema.prefault({ fetch: true }),
  proper: CustomRankSchema.prefault({ fetch: true }),
  repack: CustomRankSchema.prefault({ fetch: true }),
  retail: CustomRankSchema.prefault({ fetch: true }),
  site: CustomRankSchema.prefault({ fetch: false }),
  subbed: CustomRankSchema.prefault({ fetch: true }),
  upscaled: CustomRankSchema.prefault({ fetch: false }),
  scene: CustomRankSchema.prefault({ fetch: true }),
  uncensored: CustomRankSchema.prefault({ fetch: true }),
});

export type ExtrasRankModel = z.infer<typeof ExtrasRankModelSchema>;

/**
 * Ranking configuration for trash attributes.
 */
export const TrashRankModelSchema = z.object({
  cam: CustomRankSchema.prefault({ fetch: false }),
  cleanAudio: CustomRankSchema.prefault({ fetch: false }),
  pdtv: CustomRankSchema.prefault({ fetch: false }),
  r5: CustomRankSchema.prefault({ fetch: false }),
  screener: CustomRankSchema.prefault({ fetch: false }),
  size: CustomRankSchema.prefault({ fetch: false }),
  telecine: CustomRankSchema.prefault({ fetch: false }),
  telesync: CustomRankSchema.prefault({ fetch: false }),
});

export type TrashRankModel = z.infer<typeof TrashRankModelSchema>;

/**
 * Configuration for custom ranks.
 */
export const CustomRanksConfigSchema = z.object({
  quality: QualityRankModelSchema.prefault({}),
  rips: RipsRankModelSchema.prefault({}),
  hdr: HdrRankModelSchema.prefault({}),
  audio: AudioRankModelSchema.prefault({}),
  extras: ExtrasRankModelSchema.prefault({}),
  trash: TrashRankModelSchema.prefault({}),
});

export type CustomRanksConfig = z.infer<typeof CustomRanksConfigSchema>;

// ============================================================================
// SettingsModel Schema
// ============================================================================

/**
 * User-defined settings model for ranking torrents.
 */
export const SettingsModelSchema = z.object({
  name: z.string().default("example"),
  enabled: z.boolean().default(true),
  require: z.array(z.union([z.string(), z.instanceof(RegExp)])).default([]),
  exclude: z.array(z.union([z.string(), z.instanceof(RegExp)])).default([]),
  preferred: z.array(z.union([z.string(), z.instanceof(RegExp)])).default([]),
  resolutions: ResolutionConfigSchema.prefault({}),
  options: OptionsConfigSchema.prefault({}),
  languages: LanguagesConfigSchema.prefault({}),
  customRanks: CustomRanksConfigSchema.prefault({}),
});

export type SettingsModel = z.infer<typeof SettingsModelSchema>;

/**
 * Compile patterns in settings to RegExp objects.
 */
export function compileSettingsPatterns(
  settings: SettingsModel,
): SettingsModel {
  const compilePattern = (pattern: string | RegExp): RegExp => {
    if (pattern instanceof RegExp) {
      return pattern;
    }
    // Case-sensitive if enclosed in /
    if (pattern.startsWith("/") && pattern.endsWith("/")) {
      return new RegExp(pattern.slice(1, -1));
    }
    // Case-insensitive by default
    return new RegExp(pattern, "i");
  };

  return {
    ...settings,
    require: settings.require.map(compilePattern),
    exclude: settings.exclude.map(compilePattern),
    preferred: settings.preferred.map(compilePattern),
  };
}

/**
 * Create a default settings model instance.
 */
export function createDefaultSettings(): SettingsModel {
  return compileSettingsPatterns(SettingsModelSchema.parse({}));
}

// ============================================================================
// Torrent Schema
// ============================================================================

const INFOHASH_PATTERN = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$/;

/**
 * Represents a torrent with metadata parsed from its title.
 */
export const TorrentSchema = z.object({
  infohash: z.string().refine((val) => INFOHASH_PATTERN.test(val), {
    message:
      "Infohash must be a 32-character MD5 hash or a 40-character SHA-1 hash.",
  }),
  rawTitle: z.string(),
  torrent: z.string().nullable().default(null),
  seeders: z.int().default(0),
  leechers: z.int().default(0),
  trackers: z.array(z.string()).default([]),
  data: ParsedDataSchema,
  fetch: z.boolean().default(false),
  rank: z.int().default(0),
  levRatio: z.number().min(0).max(1).default(0),
});

export type Torrent = z.infer<typeof TorrentSchema>;

/**
 * Create a Torrent instance.
 */
export function createTorrent(input: z.input<typeof TorrentSchema>): Torrent {
  return TorrentSchema.parse(input);
}
