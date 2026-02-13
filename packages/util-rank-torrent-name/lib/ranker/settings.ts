import { z } from "zod";

import type { PartialDeep } from "type-fest";

// --- CustomRank ---

const CustomRankSchema = z.object({
  fetch: z.boolean().default(true),
  rank: z.number().optional(),
});

export type CustomRank = z.infer<typeof CustomRankSchema>;

function cr(fetch = true): CustomRank {
  return { fetch };
}

// --- Quality Ranks ---

const QualityRanksSchema = z.object({
  av1: CustomRankSchema.default(cr(false)),
  avc: CustomRankSchema.default(cr(true)),
  bluray: CustomRankSchema.default(cr(true)),
  dvd: CustomRankSchema.default(cr(false)),
  hdtv: CustomRankSchema.default(cr(true)),
  hevc: CustomRankSchema.default(cr(true)),
  mpeg: CustomRankSchema.default(cr(false)),
  remux: CustomRankSchema.default(cr(false)),
  vhs: CustomRankSchema.default(cr(false)),
  web: CustomRankSchema.default(cr(true)),
  webdl: CustomRankSchema.default(cr(true)),
  webmux: CustomRankSchema.default(cr(false)),
  xvid: CustomRankSchema.default(cr(false)),
});

// --- Rips Ranks ---

const RipsRanksSchema = z.object({
  bdrip: CustomRankSchema.default(cr(false)),
  brrip: CustomRankSchema.default(cr(true)),
  dvdrip: CustomRankSchema.default(cr(false)),
  hdrip: CustomRankSchema.default(cr(true)),
  ppvrip: CustomRankSchema.default(cr(false)),
  satrip: CustomRankSchema.default(cr(false)),
  tvrip: CustomRankSchema.default(cr(false)),
  uhdrip: CustomRankSchema.default(cr(false)),
  vhsrip: CustomRankSchema.default(cr(false)),
  webdlrip: CustomRankSchema.default(cr(false)),
  webrip: CustomRankSchema.default(cr(true)),
});

// --- HDR Ranks ---

const HdrRanksSchema = z.object({
  bit10: CustomRankSchema.default(cr(true)),
  dolbyVision: CustomRankSchema.default(cr(false)),
  hdr: CustomRankSchema.default(cr(true)),
  hdr10plus: CustomRankSchema.default(cr(true)),
  sdr: CustomRankSchema.default(cr(true)),
});

// --- Audio Ranks ---

const AudioRanksSchema = z.object({
  aac: CustomRankSchema.default(cr(true)),
  atmos: CustomRankSchema.default(cr(true)),
  dolbyDigital: CustomRankSchema.default(cr(true)),
  dolbyDigitalPlus: CustomRankSchema.default(cr(true)),
  dtsLossy: CustomRankSchema.default(cr(true)),
  dtsLossless: CustomRankSchema.default(cr(true)),
  flac: CustomRankSchema.default(cr(true)),
  mono: CustomRankSchema.default(cr(false)),
  mp3: CustomRankSchema.default(cr(false)),
  stereo: CustomRankSchema.default(cr(true)),
  surround: CustomRankSchema.default(cr(true)),
  truehd: CustomRankSchema.default(cr(true)),
});

// --- Extras Ranks ---

const ExtrasRanksSchema = z.object({
  threeD: CustomRankSchema.default(cr(false)),
  converted: CustomRankSchema.default(cr(false)),
  documentary: CustomRankSchema.default(cr(false)),
  dubbed: CustomRankSchema.default(cr(true)),
  edition: CustomRankSchema.default(cr(true)),
  hardcoded: CustomRankSchema.default(cr(true)),
  network: CustomRankSchema.default(cr(true)),
  proper: CustomRankSchema.default(cr(true)),
  repack: CustomRankSchema.default(cr(true)),
  retail: CustomRankSchema.default(cr(true)),
  site: CustomRankSchema.default(cr(false)),
  subbed: CustomRankSchema.default(cr(true)),
  upscaled: CustomRankSchema.default(cr(false)),
  scene: CustomRankSchema.default(cr(true)),
  uncensored: CustomRankSchema.default(cr(true)),
});

// --- Trash Ranks ---

const TrashRanksSchema = z.object({
  cam: CustomRankSchema.default(cr(false)),
  cleanAudio: CustomRankSchema.default(cr(false)),
  pdtv: CustomRankSchema.default(cr(false)),
  r5: CustomRankSchema.default(cr(false)),
  screener: CustomRankSchema.default(cr(false)),
  size: CustomRankSchema.default(cr(false)),
  telecine: CustomRankSchema.default(cr(false)),
  telesync: CustomRankSchema.default(cr(false)),
});

// --- Custom Ranks Config ---

const CustomRanksConfigSchema = z.object({
  quality: QualityRanksSchema.prefault({}),
  rips: RipsRanksSchema.prefault({}),
  hdr: HdrRanksSchema.prefault({}),
  audio: AudioRanksSchema.prefault({}),
  extras: ExtrasRanksSchema.prefault({}),
  trash: TrashRanksSchema.prefault({}),
});

// --- Resolution Config ---

const ResolutionConfigSchema = z.object({
  r2160p: z.boolean().default(false),
  r1440p: z.boolean().default(true),
  r1080p: z.boolean().default(true),
  r720p: z.boolean().default(true),
  r480p: z.boolean().default(false),
  r360p: z.boolean().default(false),
  unknown: z.boolean().default(true),
});

// --- Options Config ---

const OptionsConfigSchema = z.object({
  removeAllTrash: z.boolean().default(true),
  removeRanksUnder: z.number().default(-10000),
  removeUnknownLanguages: z.boolean().default(false),
  allowEnglishInLanguages: z.boolean().default(true),
  removeAdultContent: z.boolean().default(true),
});

// --- Languages Config ---

const LanguagesConfigSchema = z.object({
  required: z.array(z.string()).prefault([]),
  allowed: z.array(z.string()).prefault([]),
  exclude: z.array(z.string()).prefault([]),
  preferred: z.array(z.string()).prefault([]),
});

// --- Pattern handling ---

function compilePattern(pattern: string): RegExp {
  if (pattern.startsWith("/") && pattern.endsWith("/") && pattern.length > 2) {
    // Case-sensitive
    return new RegExp(pattern.slice(1, -1));
  }
  // Case-insensitive
  return new RegExp(pattern, "i");
}

function compilePatterns(patterns: string[]): RegExp[] {
  return patterns.map(compilePattern);
}

// --- Settings Schema ---

const SettingsRawSchema = z.object({
  require: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  preferred: z.array(z.string()).default([]),
  resolutions: ResolutionConfigSchema.prefault({}),
  options: OptionsConfigSchema.prefault({}),
  languages: LanguagesConfigSchema.prefault({}),
  customRanks: CustomRanksConfigSchema.prefault({}),
});

export type SettingsInput = z.input<typeof SettingsRawSchema>;

export interface Settings {
  require: string[];
  exclude: string[];
  preferred: string[];
  compiledRequire: RegExp[];
  compiledExclude: RegExp[];
  compiledPreferred: RegExp[];
  resolutions: z.infer<typeof ResolutionConfigSchema>;
  options: z.infer<typeof OptionsConfigSchema>;
  languages: z.infer<typeof LanguagesConfigSchema>;
  customRanks: z.infer<typeof CustomRanksConfigSchema>;
}

export function createSettings(input: PartialDeep<Settings> = {}): Settings {
  const raw = SettingsRawSchema.parse(input);

  return {
    ...raw,
    compiledRequire: compilePatterns(raw.require),
    compiledExclude: compilePatterns(raw.exclude),
    compiledPreferred: compilePatterns(raw.preferred),
  };
}

// Helper to look up custom rank from nested settings
export function getCustomRank(
  settings: Settings,
  category: string,
  key: string,
): CustomRank | undefined {
  const cat = (
    settings.customRanks as Record<string, Record<string, CustomRank>>
  )[category];
  return cat?.[key];
}

// --- Ranking Model ---

export type RankingModel = Record<string, number>;

export const DEFAULT_RANKING: RankingModel = {
  // Quality
  av1: 500,
  avc: 500,
  bluray: 100,
  dvd: -5000,
  hdtv: -5000,
  hevc: 500,
  mpeg: -1000,
  remux: 10000,
  vhs: -10000,
  web: 100,
  webdl: 200,
  webmux: -10000,
  xvid: -10000,
  // Rips
  webrip: -1000,
  bdrip: -5000,
  brrip: -10000,
  dvdrip: -5000,
  hdrip: -10000,
  ppvrip: -10000,
  tvrip: -10000,
  uhdrip: -5000,
  vhsrip: -10000,
  webdlrip: -10000,
  satrip: -10000,
  // HDR
  dolbyVision: 3000,
  hdr: 2000,
  hdr10plus: 2100,
  bit10: 100,
  sdr: 0,
  // Audio
  aac: 100,
  atmos: 1000,
  dolbyDigital: 50,
  dolbyDigitalPlus: 150,
  dtsLossy: 100,
  dtsLossless: 2000,
  mp3: -1000,
  truehd: 2000,
  flac: 0,
  // Channels
  surround: 0,
  stereo: 0,
  mono: 0,
  // Extras
  threeD: -10000,
  converted: -1000,
  documentary: -250,
  dubbed: -1000,
  edition: 100,
  hardcoded: 0,
  network: 0,
  proper: 20,
  repack: 20,
  retail: 0,
  subbed: 0,
  site: -10000,
  upscaled: -10000,
  scene: 0,
  uncensored: 0,
  // Trash
  cam: -10000,
  cleanAudio: -10000,
  r5: -10000,
  pdtv: -10000,
  screener: -10000,
  size: -10000,
  telecine: -10000,
  telesync: -10000,
};

export { SettingsRawSchema as SettingsSchema };
