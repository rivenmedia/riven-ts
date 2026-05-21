import {
  RankingModelSchema,
  SettingsSchema,
} from "@repo/util-rank-torrent-name";

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  RankingModel,
  Settings,
  SettingsInput,
} from "@repo/util-rank-torrent-name";
import type z from "zod";

export interface RankingConfig {
  settings: Settings;
  rankingModel: RankingModel;
}

interface RankingConfigFile {
  settings?: SettingsInput;
  rankingModel?: z.input<typeof RankingModelSchema>;
}

export const DEFAULT_SETTINGS_INPUT: SettingsInput = {
  require: [],
  exclude: ["\\bmatte\\b"],
  preferred: ["\\b4[Kk]|2160p?\\b", "HDR|HDR10"],
  resolutions: {
    r2160p: true,
    r1080p: true,
    r720p: true,
    r480p: true,
    r360p: false,
    unknown: true,
  },
  options: {
    removeAllTrash: true,
    removeRanksUnder: -10000,
    removeUnknownLanguages: false,
    allowEnglishInLanguages: true,
    removeAdultContent: true,
    titleSimilarity: 0.85,
  },
  languages: {
    required: [],
    allowed: [],
    exclude: [],
    preferred: ["anime"],
  },
  customRanks: {
    quality: {
      av1: { fetch: true },
      avc: { fetch: true },
      bluray: { fetch: true },
      dvd: { fetch: false },
      hdtv: { fetch: true },
      hevc: { fetch: true },
      mpeg: { fetch: false },
      remux: { fetch: true },
      vhs: { fetch: false },
      web: { fetch: true },
      webdl: { fetch: true },
      webmux: { fetch: false },
      xvid: { fetch: false },
    },
    rips: {
      bdrip: { fetch: true },
      brrip: { fetch: true },
      dvdrip: { fetch: true },
      hdrip: { fetch: true },
      ppvrip: { fetch: false },
      satrip: { fetch: false },
      tvrip: { fetch: true },
      uhdrip: { fetch: true },
      vhsrip: { fetch: false },
      webdlrip: { fetch: true },
      webrip: { fetch: true },
    },
    hdr: {
      bit10: { fetch: true },
      dolbyVision: { fetch: true },
      hdr: { fetch: true },
      hdr10plus: { fetch: true },
      sdr: { fetch: true },
    },
    audio: {
      aac: { fetch: true },
      atmos: { fetch: true },
      dolbyDigital: { fetch: true },
      dolbyDigitalPlus: { fetch: true },
      dtsLossy: { fetch: true },
      dtsLossless: { fetch: true },
      flac: { fetch: true },
      mono: { fetch: false },
      mp3: { fetch: false },
      stereo: { fetch: true },
      surround: { fetch: true },
      truehd: { fetch: true },
    },
    extras: {
      threeD: { fetch: false },
      converted: { fetch: false },
      documentary: { fetch: true },
      dubbed: { fetch: true },
      edition: { fetch: true },
      hardcoded: { fetch: true },
      network: { fetch: true },
      proper: { fetch: true },
      repack: { fetch: true },
      retail: { fetch: true },
      site: { fetch: true },
      subbed: { fetch: true },
      upscaled: { fetch: false },
      scene: { fetch: true },
      uncensored: { fetch: true },
    },
    trash: {
      cam: { fetch: false },
      cleanAudio: { fetch: false },
      pdtv: { fetch: false },
      r5: { fetch: false },
      screener: { fetch: false },
      size: { fetch: false },
      telecine: { fetch: false },
      telesync: { fetch: false },
    },
  },
};

export const DEFAULT_RANKING_MODEL_INPUT: z.input<typeof RankingModelSchema> = {
  // Quality
  av1: 0,
  avc: 0,
  bluray: 500,
  dvd: 0,
  hdtv: 500,
  hevc: 500,
  mpeg: 0,
  remux: 1250,
  vhs: 0,
  web: 150,
  webdl: 1500,
  webmux: 0,
  xvid: 0,
  // Rips
  bdrip: 1000,
  brrip: 0,
  dvdrip: 100,
  hdrip: 0,
  ppvrip: 0,
  tvrip: 0,
  uhdrip: 0,
  vhsrip: 0,
  webdlrip: 50,
  webrip: 50,
  // HDR
  bit10: 2750,
  dolbyVision: 3000,
  hdr: 2700,
  hdr10plus: 2800,
  sdr: 2300,
  // Audio
  aac: 1450,
  atmos: 1500,
  dolbyDigital: 1450,
  dolbyDigitalPlus: 1450,
  dtsLossy: 1000,
  dtsLossless: 1450,
  flac: 1100,
  mono: 0,
  mp3: 0,
  stereo: 1050,
  surround: 1050,
  truehd: 1450,
  // Extras
  threeD: 0,
  converted: 0,
  documentary: 0,
  commentary: 0,
  uncensored: 0,
  dubbed: 0,
  edition: 80,
  hardcoded: 50,
  network: 100,
  proper: 300,
  repack: 300,
  retail: 0,
  subbed: 30,
  upscaled: 0,
  scene: 0,
  // Trash
  cam: 0,
  cleanAudio: 0,
  r5: 0,
  pdtv: 0,
  satrip: 0,
  screener: 0,
  site: 0,
  size: 0,
  telecine: 0,
  telesync: 0,
};

const DEFAULT_CONFIG: RankingConfigFile = {
  settings: DEFAULT_SETTINGS_INPUT,
  rankingModel: DEFAULT_RANKING_MODEL_INPUT,
};

function getInnerObjectShape(schema: unknown): Record<string, unknown> | null {
  if (typeof schema !== "object" || schema === null) return null;

  if (
    "shape" in schema &&
    typeof (schema as { shape: unknown }).shape === "object"
  ) {
    return (schema as { shape: Record<string, unknown> }).shape;
  }

  const def = (schema as { _def?: unknown })._def;
  if (def !== null && typeof def === "object") {
    const defObj = def as Record<string, unknown>;

    // ZodDefault, ZodPrefault, ZodOptional, etc.
    if ("innerType" in defObj) {
      return getInnerObjectShape(defObj["innerType"]);
    }

    // ZodPipe (created by .transform())
    if ("in" in defObj) {
      return getInnerObjectShape(defObj["in"]);
    }
  }

  return null;
}

function collectUnknownKeys(
  schemaShape: Record<string, unknown>,
  data: unknown,
  pathPrefix: string,
): string[] {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return [];
  }

  const unknownKeys: string[] = [];
  const dataObj = data as Record<string, unknown>;

  for (const key of Object.keys(dataObj)) {
    if (!(key in schemaShape)) {
      unknownKeys.push(`${pathPrefix}.${key}`);
    } else {
      const innerShape = getInnerObjectShape(schemaShape[key]);

      if (innerShape) {
        unknownKeys.push(
          ...collectUnknownKeys(
            innerShape,
            dataObj[key],
            `${pathPrefix}.${key}`,
          ),
        );
      }
    }
  }

  return unknownKeys;
}

const TOP_LEVEL_SHAPE: Record<string, unknown> = {
  settings: SettingsSchema,
  rankingModel: RankingModelSchema,
};

export function loadRankingConfig(
  configPath: string,
  warn: (message: string) => void = console.warn,
): RankingConfig {
  const resolvedPath = path.resolve(configPath);

  if (!existsSync(resolvedPath)) {
    writeFileSync(
      resolvedPath,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
      "utf8",
    );

    return {
      settings: SettingsSchema.parse(DEFAULT_SETTINGS_INPUT),
      rankingModel: RankingModelSchema.parse(DEFAULT_RANKING_MODEL_INPUT),
    };
  }

  let raw: string;

  try {
    raw = readFileSync(resolvedPath, "utf8");
  } catch (cause) {
    throw new Error(
      `Failed to read ranking config file at "${resolvedPath}": ${String(cause)}`,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Ranking config file at "${resolvedPath}" contains invalid JSON. Fix the syntax errors or delete the file to regenerate it with defaults.`,
    );
  }

  for (const unknownKey of collectUnknownKeys(
    TOP_LEVEL_SHAPE,
    parsed,
    "rankingConfig",
  )) {
    warn(`Unknown key in ranking config: "${unknownKey}" - ignoring`);
  }

  const rawFile = parsed as RankingConfigFile;

  const settingsResult = SettingsSchema.safeParse(rawFile.settings ?? {});
  let settings: Settings;

  if (!settingsResult.success) {
    for (const error of settingsResult.error.issues) {
      warn(
        `Invalid value in ranking config settings${error.path.length > 0 ? `.${error.path.join(".")}` : ""}: ${error.message} - using defaults`,
      );
    }

    settings = SettingsSchema.parse(DEFAULT_SETTINGS_INPUT);
  } else {
    settings = settingsResult.data;
  }

  const rankingModelResult = RankingModelSchema.safeParse(
    rawFile.rankingModel ?? {},
  );
  let rankingModel: RankingModel;

  if (!rankingModelResult.success) {
    for (const error of rankingModelResult.error.issues) {
      warn(
        `Invalid value in ranking config rankingModel${error.path.length > 0 ? `.${error.path.join(".")}` : ""}: ${error.message} - using defaults`,
      );
    }

    rankingModel = RankingModelSchema.parse(DEFAULT_RANKING_MODEL_INPUT);
  } else {
    rankingModel = rankingModelResult.data;
  }

  return { settings, rankingModel };
}
