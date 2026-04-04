import { type } from "arktype";

const CustomRankSchema = type({
  fetch: "boolean = true",

  /**
   * @see {@link defaultRankingModel}
   */
  "rank?": "number",
});

export type CustomRank = typeof CustomRankSchema.infer;

function customRank(fetch: boolean): CustomRank {
  return { fetch };
}

const QualityRanksSchema = type({
  /**
   * @default { fetch: false }
   */
  av1: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  avc: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  bluray: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  dvd: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  hdtv: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  hevc: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  mpeg: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  remux: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  vhs: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  web: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  webdl: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  webmux: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  xvid: CustomRankSchema.default(() => customRank(false)),
});

const RipsRanksSchema = type({
  /**
   * @default { fetch: false }
   */
  bdrip: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  brrip: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  dvdrip: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  hdrip: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  ppvrip: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  satrip: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  tvrip: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  uhdrip: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  vhsrip: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  webdlrip: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  webrip: CustomRankSchema.default(() => customRank(true)),
});

const HdrRanksSchema = type({
  /**
   * @default { fetch: true }
   */
  bit10: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  dolbyVision: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  hdr: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  hdr10plus: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  sdr: CustomRankSchema.default(() => customRank(true)),
});

const AudioRanksSchema = type({
  /**
   * @default { fetch: true }
   */
  aac: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  atmos: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  dolbyDigital: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  dolbyDigitalPlus: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  dtsLossy: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  dtsLossless: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  flac: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  mono: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  mp3: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  stereo: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  surround: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  truehd: CustomRankSchema.default(() => customRank(true)),
});

const ExtrasRanksSchema = type({
  /**
   * @default { fetch: false }
   */
  threeD: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  converted: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  documentary: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  dubbed: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  edition: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  hardcoded: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  network: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  proper: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  repack: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  retail: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  site: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  subbed: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: false }
   */
  upscaled: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: true }
   */
  scene: CustomRankSchema.default(() => customRank(true)),

  /**
   * @default { fetch: true }
   */
  uncensored: CustomRankSchema.default(() => customRank(true)),
});

const TrashRanksSchema = type({
  /**
   * @default { fetch: false }
   */
  cam: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  cleanAudio: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  pdtv: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  r5: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  screener: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  size: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  telecine: CustomRankSchema.default(() => customRank(false)),

  /**
   * @default { fetch: false }
   */
  telesync: CustomRankSchema.default(() => customRank(false)),
});

const CustomRanksConfigSchema = type({
  quality: QualityRanksSchema,
  rips: RipsRanksSchema,
  hdr: HdrRanksSchema,
  audio: AudioRanksSchema,
  extras: ExtrasRanksSchema,
  trash: TrashRanksSchema,
});

export type CustomRanksConfig = typeof CustomRanksConfigSchema.infer;

const ResolutionConfigSchema = type({
  /**
   * @default false
   */
  r2160p: "boolean = false",

  /**
   * @default true
   */
  r1080p: "boolean = true",

  /**
   * @default true
   */
  r720p: "boolean = true",

  /**
   * @default false
   */
  r480p: "boolean = false",

  /**
   * @default false
   */
  r360p: "boolean = false",

  /**
   * @default true
   */
  unknown: "boolean = true",
});

export type ResolutionConfig = typeof ResolutionConfigSchema.infer;

const OptionsConfigSchema = type({
  /**
   * @default true
   */
  removeAllTrash: "boolean = true",

  /**
   * @default -10000
   */
  removeRanksUnder: "number.integer = -10000",

  /**
   * @default false
   */
  removeUnknownLanguages: "boolean = false",

  /**
   * @default true
   */
  allowEnglishInLanguages: "boolean = true",

  /**
   * @default true
   */
  removeAdultContent: "boolean = true",

  /**
   * @default 0.85
   */
  titleSimilarity: "0 <= number <= 1 = 0.85",
});

const LanguagesConfigSchema = type({
  /**
   * @default []
   */
  required: type("string[]").default(() => []),

  /**
   * @default []
   */
  allowed: type("string[]").default(() => []),

  /**
   * @default []
   */
  exclude: type("string[]").default(() => []),

  /**
   * @default []
   */
  preferred: type("string[]").default(() => []),
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

export const SettingsSchema = type({
  require: type("string[]").default(() => []),
  exclude: type("string[]").default(() => []),
  preferred: type("string[]").default(() => []),
  resolutions: ResolutionConfigSchema,
  options: OptionsConfigSchema,
  languages: LanguagesConfigSchema,
  customRanks: CustomRanksConfigSchema,
}).pipe((raw) => ({
  ...raw,
  compiledRequire: compilePatterns(raw.require),
  compiledExclude: compilePatterns(raw.exclude),
  compiledPreferred: compilePatterns(raw.preferred),
}));

export type SettingsInput = typeof SettingsSchema.inferIn;

export type Settings = typeof SettingsSchema.infer;

export function createSettings(input: Partial<SettingsInput> = {}): Settings {
  const settings = SettingsSchema(input);

  if (settings instanceof type.errors) {
    return settings.throw();
  }

  return settings;
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

export const RankingModelSchema = type({
  // Quality
  av1: "number.integer = 0",
  avc: "number.integer = 0",
  bluray: "number.integer = 0",
  dvd: "number.integer = 0",
  hdtv: "number.integer = 0",
  hevc: "number.integer = 0",
  mpeg: "number.integer = 0",
  remux: "number.integer = 0",
  vhs: "number.integer = 0",
  web: "number.integer = 0",
  webdl: "number.integer = 0",
  webmux: "number.integer = 0",
  xvid: "number.integer = 0",

  // Rips
  bdrip: "number.integer = 0",
  brrip: "number.integer = 0",
  dvdrip: "number.integer = 0",
  hdrip: "number.integer = 0",
  ppvrip: "number.integer = 0",
  tvrip: "number.integer = 0",
  uhdrip: "number.integer = 0",
  vhsrip: "number.integer = 0",
  webdlrip: "number.integer = 0",
  webrip: "number.integer = 0",

  // HDR
  bit10: "number.integer = 0",
  dolbyVision: "number.integer = 0",
  hdr: "number.integer = 0",
  hdr10plus: "number.integer = 0",
  sdr: "number.integer = 0",

  // Audio
  aac: "number.integer = 0",
  atmos: "number.integer = 0",
  dolbyDigital: "number.integer = 0",
  dolbyDigitalPlus: "number.integer = 0",
  dtsLossy: "number.integer = 0",
  dtsLossless: "number.integer = 0",
  flac: "number.integer = 0",
  mono: "number.integer = 0",
  mp3: "number.integer = 0",
  stereo: "number.integer = 0",
  surround: "number.integer = 0",
  truehd: "number.integer = 0",

  // Extras
  threeD: "number.integer = 0",
  converted: "number.integer = 0",
  documentary: "number.integer = 0",
  commentary: "number.integer = 0",
  uncensored: "number.integer = 0",
  dubbed: "number.integer = 0",
  edition: "number.integer = 0",
  hardcoded: "number.integer = 0",
  network: "number.integer = 0",
  proper: "number.integer = 0",
  repack: "number.integer = 0",
  retail: "number.integer = 0",
  subbed: "number.integer = 0",
  upscaled: "number.integer = 0",
  scene: "number.integer = 0",

  // Trash
  cam: "number.integer = 0",
  cleanAudio: "number.integer = 0",
  r5: "number.integer = 0",
  pdtv: "number.integer = 0",
  satrip: "number.integer = 0",
  screener: "number.integer = 0",
  site: "number.integer = 0",
  size: "number.integer = 0",
  telecine: "number.integer = 0",
  telesync: "number.integer = 0",
});

export type RankingModel = typeof RankingModelSchema.infer;

export const createRankingModel = (input: typeof RankingModelSchema.inferIn) =>
  RankingModelSchema(input);

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
