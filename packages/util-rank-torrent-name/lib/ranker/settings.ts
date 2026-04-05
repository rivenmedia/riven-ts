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

const customRankDefaultFalse = CustomRankSchema.default(customRank(false));
const customRankDefaultTrue = CustomRankSchema.default(customRank(true));

const QualityRanksSchema = z.object({
  /**
   * @default { fetch: false }
   */
  av1: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  avc: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  bluray: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  dvd: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  hdtv: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  hevc: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  mpeg: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  remux: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  vhs: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  web: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  webdl: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  webmux: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  xvid: customRankDefaultFalse,
});

const RipsRanksSchema = z.object({
  /**
   * @default { fetch: false }
   */
  bdrip: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  brrip: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  dvdrip: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  hdrip: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  ppvrip: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  satrip: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  tvrip: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  uhdrip: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  vhsrip: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  webdlrip: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  webrip: customRankDefaultTrue,
});

const HdrRanksSchema = z.object({
  /**
   * @default { fetch: true }
   */
  bit10: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  dolbyVision: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  hdr: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  hdr10plus: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  sdr: customRankDefaultTrue,
});

const AudioRanksSchema = z.object({
  /**
   * @default { fetch: true }
   */
  aac: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  atmos: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  dolbyDigital: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  dolbyDigitalPlus: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  dtsLossy: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  dtsLossless: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  flac: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  mono: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  mp3: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  stereo: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  surround: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  truehd: customRankDefaultTrue,
});

const ExtrasRanksSchema = z.object({
  /**
   * @default { fetch: false }
   */
  threeD: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  converted: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  documentary: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  dubbed: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  edition: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  hardcoded: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  network: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  proper: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  repack: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  retail: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  site: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  subbed: customRankDefaultTrue,

  /**
   * @default { fetch: false }
   */
  upscaled: customRankDefaultFalse,

  /**
   * @default { fetch: true }
   */
  scene: customRankDefaultTrue,

  /**
   * @default { fetch: true }
   */
  uncensored: customRankDefaultTrue,
});

const TrashRanksSchema = z.object({
  /**
   * @default { fetch: false }
   */
  cam: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  cleanAudio: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  pdtv: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  r5: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  screener: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  size: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  telecine: customRankDefaultFalse,

  /**
   * @default { fetch: false }
   */
  telesync: customRankDefaultFalse,
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

const rankingModelField = z.int().default(0);

export const RankingModelSchema = z.object({
  // Quality
  av1: rankingModelField,
  avc: rankingModelField,
  bluray: rankingModelField,
  dvd: rankingModelField,
  hdtv: rankingModelField,
  hevc: rankingModelField,
  mpeg: rankingModelField,
  remux: rankingModelField,
  vhs: rankingModelField,
  web: rankingModelField,
  webdl: rankingModelField,
  webmux: rankingModelField,
  xvid: rankingModelField,

  // Rips
  bdrip: rankingModelField,
  brrip: rankingModelField,
  dvdrip: rankingModelField,
  hdrip: rankingModelField,
  ppvrip: rankingModelField,
  tvrip: rankingModelField,
  uhdrip: rankingModelField,
  vhsrip: rankingModelField,
  webdlrip: rankingModelField,
  webrip: rankingModelField,

  // HDR
  bit10: rankingModelField,
  dolbyVision: rankingModelField,
  hdr: rankingModelField,
  hdr10plus: rankingModelField,
  sdr: rankingModelField,

  // Audio
  aac: rankingModelField,
  atmos: rankingModelField,
  dolbyDigital: rankingModelField,
  dolbyDigitalPlus: rankingModelField,
  dtsLossy: rankingModelField,
  dtsLossless: rankingModelField,
  flac: rankingModelField,
  mono: rankingModelField,
  mp3: rankingModelField,
  stereo: rankingModelField,
  surround: rankingModelField,
  truehd: rankingModelField,

  // Extras
  threeD: rankingModelField,
  converted: rankingModelField,
  documentary: rankingModelField,
  commentary: rankingModelField,
  uncensored: rankingModelField,
  dubbed: rankingModelField,
  edition: rankingModelField,
  hardcoded: rankingModelField,
  network: rankingModelField,
  proper: rankingModelField,
  repack: rankingModelField,
  retail: rankingModelField,
  subbed: rankingModelField,
  upscaled: rankingModelField,
  scene: rankingModelField,

  // Trash
  cam: rankingModelField,
  cleanAudio: rankingModelField,
  r5: rankingModelField,
  pdtv: rankingModelField,
  satrip: rankingModelField,
  screener: rankingModelField,
  site: rankingModelField,
  size: rankingModelField,
  telecine: rankingModelField,
  telesync: rankingModelField,
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
