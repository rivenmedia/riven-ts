import { z } from "zod";

/**
 * @public
 */
export const ResolutionConfigSchema = z.object({
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

/**
 * @public
 */
export const OptionsConfigSchema = z.object({
  /**
   * @default true
   */
  removeAllTrash: z.boolean().default(true),

  /**
   * @default -10000
   */
  removeRanksUnder: z.number().default(-10_000),

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

/**
 * @public
 */
export const LanguagesConfigSchema = z.object({
  /**
   * @default []
   */
  required: z.array(z.string()).default([]),

  /**
   * @default []
   */
  allowed: z.array(z.string()).default([]),

  /**
   * @default []
   */
  exclude: z.array(z.string()).default([]),

  /**
   * @default []
   */
  preferred: z.array(z.string()).default([]),
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

export const SettingsSchema = z.object({
  require: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  preferred: z.array(z.string()).default([]),
  resolutions: ResolutionConfigSchema.default(() =>
    ResolutionConfigSchema.parse({}),
  ),
  options: OptionsConfigSchema.default(() => OptionsConfigSchema.parse({})),
  languages: LanguagesConfigSchema.default(() =>
    LanguagesConfigSchema.parse({}),
  ),
});

export type SettingsInput = z.input<typeof SettingsSchema>;

export const Settings = SettingsSchema.transform((raw) => ({
  ...raw,
  compiledRequire: compilePatterns(raw.require),
  compiledExclude: compilePatterns(raw.exclude),
  compiledPreferred: compilePatterns(raw.preferred),
}));

export type Settings = z.infer<typeof Settings>;

export function createSettings(input: SettingsInput = {}): Settings {
  return Settings.parse(input);
}

const Rank = z.int().nullable();

export const RankingModelSchema = z.strictObject({
  // Quality
  av1: Rank.default(null),
  avc: Rank.default(null),
  bluray: Rank.default(null),
  dvd: Rank.default(null),
  hdtv: Rank.default(null),
  hevc: Rank.default(null),
  mpeg: Rank.default(null),
  remux: Rank.default(null),
  vhs: Rank.default(null),
  web: Rank.default(null),
  webdl: Rank.default(null),
  webmux: Rank.default(null),
  xvid: Rank.default(null),

  // Rips
  bdrip: Rank.default(null),
  brrip: Rank.default(null),
  dvdrip: Rank.default(null),
  hdrip: Rank.default(null),
  ppvrip: Rank.default(null),
  tvrip: Rank.default(null),
  uhdrip: Rank.default(null),
  vhsrip: Rank.default(null),
  webdlrip: Rank.default(null),
  webrip: Rank.default(null),

  // HDR
  bit10: Rank.default(null),
  dolbyVision: Rank.default(null),
  hdr: Rank.default(null),
  hdr10plus: Rank.default(null),
  sdr: Rank.default(null),

  // Audio
  aac: Rank.default(null),
  atmos: Rank.default(null),
  dolbyDigital: Rank.default(null),
  dolbyDigitalPlus: Rank.default(null),
  dtsLossy: Rank.default(null),
  dtsLossless: Rank.default(null),
  flac: Rank.default(null),
  mono: Rank.default(null),
  mp3: Rank.default(null),
  stereo: Rank.default(null),
  surround: Rank.default(null),
  truehd: Rank.default(null),

  // Extras
  threeD: Rank.default(null),
  converted: Rank.default(null),
  documentary: Rank.default(null),
  commentary: Rank.default(null),
  uncensored: Rank.default(null),
  dubbed: Rank.default(null),
  edition: Rank.default(null),
  hardcoded: Rank.default(null),
  network: Rank.default(null),
  proper: Rank.default(null),
  repack: Rank.default(null),
  retail: Rank.default(null),
  subbed: Rank.default(null),
  upscaled: Rank.default(null),
  scene: Rank.default(null),

  // Trash
  cam: Rank.default(null),
  cleanAudio: Rank.default(null),
  r5: Rank.default(null),
  pdtv: Rank.default(null),
  satrip: Rank.default(null),
  screener: Rank.default(null),
  site: Rank.default(null),
  size: Rank.default(null),
  telecine: Rank.default(null),
  telesync: Rank.default(null),
});

export type RankingModel = z.infer<typeof RankingModelSchema>;

export const createRankingModel = (
  input: z.input<typeof RankingModelSchema> = {},
) => RankingModelSchema.decode(input);

export function isFetchEnabled(
  rankingModel: RankingModel,
  key: keyof RankingModel,
) {
  return rankingModel[key] !== null;
}
