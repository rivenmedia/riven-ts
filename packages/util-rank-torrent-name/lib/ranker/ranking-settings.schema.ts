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
    return new RegExp(pattern.slice(1, -1), "u");
  }

  // Case-insensitive
  return new RegExp(pattern, "iu");
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

const RankingModelSettingCategory = z.enum([
  "quality",
  "rips",
  "hdr",
  "audio",
  "extras",
  "trash",
]);

export const RankingModelSchemaMetadata = z.strictObject({
  category: RankingModelSettingCategory,
});

export const RankingModelSchema = z.strictObject({
  // Quality
  av1: Rank.default(null).meta({ category: "quality" }),
  avc: Rank.default(null).meta({ category: "quality" }),
  bluray: Rank.default(null).meta({ category: "quality" }),
  dvd: Rank.default(null).meta({ category: "quality" }),
  hdtv: Rank.default(null).meta({ category: "quality" }),
  hevc: Rank.default(null).meta({ category: "quality" }),
  mpeg: Rank.default(null).meta({ category: "quality" }),
  remux: Rank.default(null).meta({ category: "quality" }),
  vhs: Rank.default(null).meta({ category: "quality" }),
  web: Rank.default(null).meta({ category: "quality" }),
  webdl: Rank.default(null).meta({ category: "quality" }),
  webmux: Rank.default(null).meta({ category: "quality" }),
  xvid: Rank.default(null).meta({ category: "quality" }),

  // Rips
  bdrip: Rank.default(null).meta({ category: "rips" }),
  brrip: Rank.default(null).meta({ category: "rips" }),
  dvdrip: Rank.default(null).meta({ category: "rips" }),
  hdrip: Rank.default(null).meta({ category: "rips" }),
  ppvrip: Rank.default(null).meta({ category: "rips" }),
  tvrip: Rank.default(null).meta({ category: "rips" }),
  uhdrip: Rank.default(null).meta({ category: "rips" }),
  vhsrip: Rank.default(null).meta({ category: "rips" }),
  webdlrip: Rank.default(null).meta({ category: "rips" }),
  webrip: Rank.default(null).meta({ category: "rips" }),

  // HDR
  bit10: Rank.default(null).meta({ category: "hdr" }),
  dolbyVision: Rank.default(null).meta({ category: "hdr" }),
  hdr: Rank.default(null).meta({ category: "hdr" }),
  hdr10plus: Rank.default(null).meta({ category: "hdr" }),
  sdr: Rank.default(null).meta({ category: "hdr" }),

  // Audio
  aac: Rank.default(null).meta({ category: "audio" }),
  atmos: Rank.default(null).meta({ category: "audio" }),
  dolbyDigital: Rank.default(null).meta({ category: "audio" }),
  dolbyDigitalPlus: Rank.default(null).meta({ category: "audio" }),
  dtsLossy: Rank.default(null).meta({ category: "audio" }),
  dtsLossless: Rank.default(null).meta({ category: "audio" }),
  flac: Rank.default(null).meta({ category: "audio" }),
  mono: Rank.default(null).meta({ category: "audio" }),
  mp3: Rank.default(null).meta({ category: "audio" }),
  stereo: Rank.default(null).meta({ category: "audio" }),
  surround: Rank.default(null).meta({ category: "audio" }),
  truehd: Rank.default(null).meta({ category: "audio" }),

  // Extras
  threeD: Rank.default(null).meta({ category: "extras" }),
  converted: Rank.default(null).meta({ category: "extras" }),
  documentary: Rank.default(null).meta({ category: "extras" }),
  commentary: Rank.default(null).meta({ category: "extras" }),
  uncensored: Rank.default(null).meta({ category: "extras" }),
  dubbed: Rank.default(null).meta({ category: "extras" }),
  edition: Rank.default(null).meta({ category: "extras" }),
  hardcoded: Rank.default(null).meta({ category: "extras" }),
  network: Rank.default(null).meta({ category: "extras" }),
  proper: Rank.default(null).meta({ category: "extras" }),
  repack: Rank.default(null).meta({ category: "extras" }),
  retail: Rank.default(null).meta({ category: "extras" }),
  subbed: Rank.default(null).meta({ category: "extras" }),
  upscaled: Rank.default(null).meta({ category: "extras" }),
  scene: Rank.default(null).meta({ category: "extras" }),

  // Trash
  cam: Rank.default(null).meta({ category: "trash" }),
  cleanAudio: Rank.default(null).meta({ category: "trash" }),
  r5: Rank.default(null).meta({ category: "trash" }),
  pdtv: Rank.default(null).meta({ category: "trash" }),
  satrip: Rank.default(null).meta({ category: "trash" }),
  screener: Rank.default(null).meta({ category: "trash" }),
  site: Rank.default(null).meta({ category: "trash" }),
  size: Rank.default(null).meta({ category: "trash" }),
  telecine: Rank.default(null).meta({ category: "trash" }),
  telesync: Rank.default(null).meta({ category: "trash" }),
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
