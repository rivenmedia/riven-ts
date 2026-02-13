import { z } from "zod";

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

export type CustomRanksConfig = z.infer<typeof CustomRanksConfigSchema>;

// --- Resolution Config ---

const ResolutionConfigSchema = z.object({
  r2160p: z.boolean().default(false),
  r1080p: z.boolean().default(true),
  r720p: z.boolean().default(true),
  r480p: z.boolean().default(false),
  r360p: z.boolean().default(false),
  unknown: z.boolean().default(true),
});

export type ResolutionConfig = z.infer<typeof ResolutionConfigSchema>;

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

export const SettingsSchema = z
  .object({
    require: z.array(z.string()).default([]),
    exclude: z.array(z.string()).default([]),
    preferred: z.array(z.string()).default([]),
    resolutions: ResolutionConfigSchema.prefault({}),
    options: OptionsConfigSchema.prefault({}),
    languages: LanguagesConfigSchema.prefault({}),
    customRanks: CustomRanksConfigSchema.prefault({}),
  })
  .transform((raw) => ({
    ...raw,
    compiledRequire: compilePatterns(raw.require),
    compiledExclude: compilePatterns(raw.exclude),
    compiledPreferred: compilePatterns(raw.preferred),
  }));

export type SettingsInput = z.input<typeof SettingsSchema>;

export type Settings = z.infer<typeof SettingsSchema>;

export function createSettings(input: SettingsInput = {}): Settings {
  return SettingsSchema.parse(input);
}

// Helper to look up custom rank from nested settings
export function getCustomRank(
  settings: Settings,
  category: keyof CustomRanksConfig,
  key: keyof RankingModel,
): CustomRank {
  const cat = settings.customRanks[category];

  return cat[key as keyof typeof cat];
}

// --- Ranking Model ---

export const RankingModelSchema = z.object({
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
  threeD: z.int().default(0),
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
  pdtv: z.int().default(0),
  satrip: z.int().default(0),
  screener: z.int().default(0),
  site: z.int().default(0),
  size: z.int().default(0),
  telecine: z.int().default(0),
  telesync: z.int().default(0),
});

export type RankingModel = z.infer<typeof RankingModelSchema>;

export const DEFAULT_RANKING = RankingModelSchema.decode({
  // quality
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
  pdtv: -10000,

  // rips
  bdrip: -5000,
  brrip: -10000,
  dvdrip: -5000,
  hdrip: -10000,
  ppvrip: -10000,
  tvrip: -10000,
  uhdrip: -5000,
  vhsrip: -10000,
  webdlrip: -10000,
  webrip: -1000,

  // hdr
  bit10: 100,
  dolbyVision: 3000,
  hdr: 2000,
  hdr10plus: 2100,

  // audio
  aac: 100,
  atmos: 1000,
  dolbyDigital: 50,
  dolbyDigitalPlus: 150,
  dtsLossy: 100,
  dtsLossless: 2000,
  mp3: -1000,
  truehd: 2000,

  // extras
  threeD: -10000,
  converted: -1000,
  documentary: -250,
  dubbed: -1000,
  edition: 100,
  proper: 20,
  repack: 20,
  site: -10000,
  upscaled: -10000,

  // trash
  cam: -10000,
  cleanAudio: -10000,
  r5: -10000,
  satrip: -10000,
  screener: -10000,
  size: -10000,
  telecine: -10000,
  telesync: -10000,
});
