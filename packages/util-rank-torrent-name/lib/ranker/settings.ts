import { z } from "zod";

const CustomRankSchema = z.object({
  fetch: z.boolean().default(true),

  /**
   * @see {@link defaultRankingModel}
   */
  rank: z.number().optional(),
});

export type CustomRank = z.infer<typeof CustomRankSchema>;

function customRank(fetch: boolean): CustomRank {
  return { fetch };
}

const QualityRanksSchema = z.object({
  /**
   * @default { fetch: false }
   */
  av1: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  avc: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  bluray: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  dvd: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  hdtv: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  hevc: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  mpeg: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  remux: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  vhs: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  web: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  webdl: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  webmux: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  xvid: CustomRankSchema.default(customRank(false)),
});

const RipsRanksSchema = z.object({
  /**
   * @default { fetch: false }
   */
  bdrip: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  brrip: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  dvdrip: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  hdrip: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  ppvrip: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  satrip: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  tvrip: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  uhdrip: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  vhsrip: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  webdlrip: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  webrip: CustomRankSchema.default(customRank(true)),
});

const HdrRanksSchema = z.object({
  /**
   * @default { fetch: true }
   */
  bit10: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  dolbyVision: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  hdr: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  hdr10plus: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  sdr: CustomRankSchema.default(customRank(true)),
});

const AudioRanksSchema = z.object({
  /**
   * @default { fetch: true }
   */
  aac: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  atmos: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  dolbyDigital: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  dolbyDigitalPlus: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  dtsLossy: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  dtsLossless: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  flac: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  mono: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  mp3: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  stereo: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  surround: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  truehd: CustomRankSchema.default(customRank(true)),
});

const ExtrasRanksSchema = z.object({
  /**
   * @default { fetch: false }
   */
  threeD: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  converted: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  documentary: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  dubbed: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  edition: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  hardcoded: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  network: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  proper: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  repack: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  retail: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  site: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  subbed: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: false }
   */
  upscaled: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: true }
   */
  scene: CustomRankSchema.default(customRank(true)),

  /**
   * @default { fetch: true }
   */
  uncensored: CustomRankSchema.default(customRank(true)),
});

const TrashRanksSchema = z.object({
  /**
   * @default { fetch: false }
   */
  cam: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  cleanAudio: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  pdtv: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  r5: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  screener: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  size: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  telecine: CustomRankSchema.default(customRank(false)),

  /**
   * @default { fetch: false }
   */
  telesync: CustomRankSchema.default(customRank(false)),
});

const CustomRanksConfigSchema = z.object({
  quality: QualityRanksSchema.prefault({}),
  rips: RipsRanksSchema.prefault({}),
  hdr: HdrRanksSchema.prefault({}),
  audio: AudioRanksSchema.prefault({}),
  extras: ExtrasRanksSchema.prefault({}),
  trash: TrashRanksSchema.prefault({}),
});

export type CustomRanksConfig = z.infer<typeof CustomRanksConfigSchema>;

const ResolutionConfigSchema = z.object({
  /**
   * @default false
   */
  r2160p: z.boolean().default(false),

  /**
   * @default true
   */
  r1080p: z.boolean().default(true),

  /**
   * @default true
   */
  r720p: z.boolean().default(true),

  /**
   * @default false
   */
  r480p: z.boolean().default(false),

  /**
   * @default false
   */
  r360p: z.boolean().default(false),

  /**
   * @default true
   */
  unknown: z.boolean().default(true),
});

export type ResolutionConfig = z.infer<typeof ResolutionConfigSchema>;

const OptionsConfigSchema = z.object({
  /**
   * @default true
   */
  removeAllTrash: z.boolean().default(true),

  /**
   * @default -10000
   */
  removeRanksUnder: z.number().default(-10000),

  /**
   * @default false
   */
  removeUnknownLanguages: z.boolean().default(false),

  /**
   * @default true
   */
  allowEnglishInLanguages: z.boolean().default(true),

  /**
   * @default true
   */
  removeAdultContent: z.boolean().default(true),

  /**
   * @default 0.85
   */
  titleSimilarity: z.number().min(0).max(1).default(0.85),
});

const LanguagesConfigSchema = z.object({
  /**
   * @default []
   */
  required: z.array(z.string()).prefault([]),

  /**
   * @default []
   */
  allowed: z.array(z.string()).prefault([]),

  /**
   * @default []
   */
  exclude: z.array(z.string()).prefault([]),

  /**
   * @default []
   */
  preferred: z.array(z.string()).prefault([]),
});

function compilePattern(pattern: string): RegExp {
  // Case-sensitive
  if (pattern.startsWith("/") && pattern.endsWith("/") && pattern.length > 2) {
    return new RegExp(pattern.slice(1, -1));
  }

  // Case-insensitive
  return new RegExp(pattern, "i");
}

function compilePatterns(patterns: string[]): RegExp[] {
  return patterns.map(compilePattern);
}

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

export const RankingModelSchema = z.object({
  // Quality
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

  // Rips
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

  // HDR
  bit10: z.int().default(0),
  dolbyVision: z.int().default(0),
  hdr: z.int().default(0),
  hdr10plus: z.int().default(0),
  sdr: z.int().default(0),

  // Audio
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

  // Extras
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

  // Trash
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

export const createRankingModel = (input: z.input<typeof RankingModelSchema>) =>
  RankingModelSchema.decode(input);

export const defaultRankingModel = createRankingModel({
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
  pdtv: -10000,

  // Rips
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

  // HDR
  bit10: 100,
  dolbyVision: 3000,
  hdr: 2000,
  hdr10plus: 2100,

  // Audio
  aac: 100,
  atmos: 1000,
  dolbyDigital: 50,
  dolbyDigitalPlus: 150,
  dtsLossy: 100,
  dtsLossless: 2000,
  mp3: -1000,
  truehd: 2000,

  // Extras
  threeD: -10000,
  converted: -1000,
  documentary: -250,
  dubbed: -1000,
  edition: 100,
  proper: 20,
  repack: 20,
  site: -10000,
  upscaled: -10000,

  // Trash
  cam: -10000,
  cleanAudio: -10000,
  r5: -10000,
  satrip: -10000,
  screener: -10000,
  size: -10000,
  telecine: -10000,
  telesync: -10000,
});
