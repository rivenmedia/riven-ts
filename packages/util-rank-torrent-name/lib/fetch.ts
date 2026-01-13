/**
 * Functions to determine if a torrent should be fetched based on user settings.
 */
import type { ParsedData, SettingsModel } from "./models.ts";

// Language groups
const ANIME = new Set(["ja", "zh", "ko"]);
const NON_ANIME = new Set([
  "de",
  "es",
  "hi",
  "ta",
  "ru",
  "ua",
  "th",
  "it",
  "ar",
  "pt",
  "fr",
  "pa",
  "mr",
  "gu",
  "te",
  "kn",
  "ml",
  "vi",
  "id",
  "tr",
  "he",
  "fa",
  "el",
  "lt",
  "lv",
  "et",
  "pl",
  "cs",
  "sk",
  "hu",
  "ro",
  "bg",
  "sr",
  "hr",
  "sl",
  "nl",
  "da",
  "fi",
  "sv",
  "no",
  "ms",
]);
const COMMON = new Set([
  "de",
  "es",
  "hi",
  "ta",
  "ru",
  "ua",
  "th",
  "it",
  "zh",
  "ar",
  "fr",
]);
const ALL = new Set([...ANIME, ...NON_ANIME]);

export interface FetchResult {
  fetch: boolean;
  failedKeys: string[];
}

/**
 * Check user settings and unwanted quality to determine if torrent should be fetched.
 */
export function checkFetch(
  data: ParsedData,
  settings: SettingsModel,
  speedMode = true,
): FetchResult {
  const failedKeys = new Set<string>();

  // Populate language settings
  populateLangs(settings);

  if (speedMode) {
    // Fail as soon as possible
    if (trashHandler(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (adultHandler(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (checkRequired(data, settings)) {
      return { fetch: true, failedKeys: Array.from(failedKeys) };
    }

    if (checkExclude(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (languageHandler(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (fetchResolution(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (fetchQuality(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (fetchAudio(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (fetchHdr(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (fetchCodec(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }

    if (fetchOther(data, settings, failedKeys)) {
      return { fetch: false, failedKeys: Array.from(failedKeys) };
    }
  } else {
    // Gather all failed keys for more information
    trashHandler(data, settings, failedKeys);
    adultHandler(data, settings, failedKeys);
    checkRequired(data, settings);
    checkExclude(data, settings, failedKeys);
    languageHandler(data, settings, failedKeys);
    fetchResolution(data, settings, failedKeys);
    fetchQuality(data, settings, failedKeys);
    fetchAudio(data, settings, failedKeys);
    fetchHdr(data, settings, failedKeys);
    fetchCodec(data, settings, failedKeys);
    fetchOther(data, settings, failedKeys);
  }

  if (failedKeys.size > 0) {
    return { fetch: false, failedKeys: Array.from(failedKeys) };
  }

  return { fetch: true, failedKeys: [] };
}

/**
 * Check if the title is trash based on user settings.
 */
function trashHandler(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  if (settings.options.removeAllTrash) {
    const trashQualities = ["CAM", "PDTV", "R5", "SCR", "TeleCine", "TeleSync"];

    if (data.quality && trashQualities.includes(data.quality)) {
      failedKeys.add("trash_quality");

      return true;
    }

    if (data.audio.includes("HQ Clean Audio")) {
      failedKeys.add("trash_audio");

      return true;
    }

    if (data.trash) {
      failedKeys.add("trash_flag");

      return true;
    }
  }

  return false;
}

/**
 * Check if the title is adult based on user settings.
 */
function adultHandler(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  if (data.adult && settings.options.removeAdultContent) {
    failedKeys.add("trash_adult");

    return true;
  }

  return false;
}

/**
 * Check if the languages are excluded based on user settings.
 */
function languageHandler(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  const removeUnknown = settings.options.removeUnknownLanguages;
  const requiredLangs = settings.languages.required;
  const excludeLangs = settings.languages.exclude;

  if (data.languages.length === 0) {
    if (removeUnknown) {
      failedKeys.add("unknown_language");

      return true;
    }

    return false;
  }

  if (
    data.languages.includes("en") &&
    settings.options.allowEnglishInLanguages
  ) {
    return false;
  }

  if (
    requiredLangs.length > 0 &&
    data.languages.some((lang) => requiredLangs.includes(lang))
  ) {
    return false;
  }

  const excluded = data.languages.filter((lang) => excludeLangs.includes(lang));

  if (excluded.length > 0) {
    for (const lang of excluded) {
      failedKeys.add(`lang_${lang}`);
    }

    return true;
  }

  return false;
}

/**
 * Populate the languages based on user settings.
 */
function populateLangs(settings: SettingsModel): void {
  const excludeLangs = new Set(settings.languages.exclude);
  const requiredLangs = new Set(settings.languages.required);

  const languageGroups: Record<string, Set<string>> = {
    anime: ANIME,
    non_anime: NON_ANIME,
    common: COMMON,
    all: ALL,
  };

  for (const [langGroup, langSet] of Object.entries(languageGroups)) {
    if (excludeLangs.has(langGroup)) {
      langSet.forEach((l) => excludeLangs.add(l));
    }

    if (requiredLangs.has(langGroup)) {
      langSet.forEach((l) => requiredLangs.add(l));
    }
  }

  settings.languages.exclude = Array.from(excludeLangs);
  settings.languages.required = Array.from(requiredLangs);
}

/**
 * Check if the title meets the required patterns.
 */
function checkRequired(data: ParsedData, settings: SettingsModel): boolean {
  if (settings.require.length > 0) {
    return settings.require.some((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern.test(data.rawTitle);
      }

      return new RegExp(pattern, "i").test(data.rawTitle);
    });
  }

  return false;
}

/**
 * Check if the title contains excluded patterns.
 */
function checkExclude(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  if (settings.exclude.length > 0) {
    for (const pattern of settings.exclude) {
      const regex =
        pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");

      if (regex.test(data.rawTitle)) {
        failedKeys.add(`exclude_regex '${regex.source}'`);

        return true;
      }
    }
  }

  return false;
}

/**
 * Check if the quality is fetchable based on user settings.
 */
function fetchQuality(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  if (!data.quality) {
    return false;
  }

  const qualityMap: Record<
    string,
    [keyof typeof settings.customRanks, string]
  > = {
    WEB: ["quality", "web"],
    "WEB-DL": ["quality", "webdl"],
    BluRay: ["quality", "bluray"],
    HDTV: ["quality", "hdtv"],
    VHS: ["quality", "vhs"],
    WEBMux: ["quality", "webmux"],
    "BluRay REMUX": ["quality", "remux"],
    REMUX: ["quality", "remux"],
    WEBRip: ["rips", "webrip"],
    "WEB-DLRip": ["rips", "webdlrip"],
    UHDRip: ["rips", "uhdrip"],
    HDRip: ["rips", "hdrip"],
    DVDRip: ["rips", "dvdrip"],
    BDRip: ["rips", "bdrip"],
    BRRip: ["rips", "brrip"],
    VHSRip: ["rips", "vhsrip"],
    PPVRip: ["rips", "ppvrip"],
    SATRip: ["rips", "satrip"],
    TeleCine: ["trash", "telecine"],
    TeleSync: ["trash", "telesync"],
    SCR: ["trash", "screener"],
    R5: ["trash", "r5"],
    CAM: ["trash", "cam"],
    PDTV: ["trash", "pdtv"],
  };

  const mapping = qualityMap[data.quality];

  if (mapping) {
    const [category, key] = mapping;
    const customRankCategory = settings.customRanks[category] as Record<
      string,
      { fetch: boolean }
    >;

    if (customRankCategory[key] && !customRankCategory[key].fetch) {
      failedKeys.add(`${category}_${key}`);

      return true;
    }
  }

  return false;
}

/**
 * Check if the resolution is fetchable based on user settings.
 */
function fetchResolution(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  if (!data.resolution || data.resolution === "unknown") {
    if (!settings.resolutions.unknown) {
      failedKeys.add("resolution_unknown");
      return true;
    }

    return false;
  }

  const resMap: Record<string, keyof typeof settings.resolutions> = {
    "2160p": "r2160p",
    "4k": "r2160p",
    "1080p": "r1080p",
    "1440p": "r1080p",
    "720p": "r720p",
    "480p": "r480p",
    "576p": "r480p",
    "360p": "r360p",
    "240p": "r360p",
  };

  const resKey = resMap[data.resolution.toLowerCase()] ?? "unknown";

  if (!settings.resolutions[resKey]) {
    failedKeys.add("resolution");

    return true;
  }

  return false;
}

/**
 * Check if the codec is fetchable based on user settings.
 */
function fetchCodec(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  if (!data.codec) {
    return false;
  }

  const codec = data.codec.toLowerCase();
  const codecMap: Record<string, keyof typeof settings.customRanks.quality> = {
    avc: "avc",
    h264: "avc",
    x264: "avc",
    hevc: "hevc",
    h265: "hevc",
    x265: "hevc",
    av1: "av1",
    xvid: "xvid",
    mpeg: "mpeg",
    mpeg2: "mpeg",
  };

  const mappedCodec = codecMap[codec];

  if (
    mappedCodec &&
    Object.keys(settings.customRanks.quality[mappedCodec]).length > 0
  ) {
    const codecRank = settings.customRanks.quality[mappedCodec];

    if (!codecRank.fetch) {
      failedKeys.add(`codec_${mappedCodec}`);

      return true;
    }
  }
  return false;
}

/**
 * Check if the audio is fetchable based on user settings.
 */
function fetchAudio(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  if (data.audio.length === 0) {
    return false;
  }

  const audioMap: Record<string, [keyof typeof settings.customRanks, string]> =
    {
      AAC: ["audio", "aac"],
      Atmos: ["audio", "atmos"],
      "Dolby Digital": ["audio", "dolbyDigital"],
      "Dolby Digital Plus": ["audio", "dolbyDigitalPlus"],
      "DTS Lossy": ["audio", "dtsLossy"],
      "DTS Lossless": ["audio", "dtsLossless"],
      FLAC: ["audio", "flac"],
      MP3: ["audio", "mp3"],
      TrueHD: ["audio", "truehd"],
      "HQ Clean Audio": ["trash", "cleanAudio"],
    };

  for (const audioFormat of data.audio) {
    const mapping = audioMap[audioFormat];

    if (!mapping) {
      continue;
    }

    const [category, key] = mapping;
    const customRankCategory = settings.customRanks[category] as Record<
      string,
      { fetch: boolean }
    >;

    if (customRankCategory[key] && !customRankCategory[key].fetch) {
      failedKeys.add(`${category}_${key}`);

      return true;
    }
  }
  return false;
}

/**
 * Check if the HDR is fetchable based on user settings.
 */
function fetchHdr(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  if (data.hdr.length === 0) {
    return false;
  }

  const hdrMap: Record<string, keyof typeof settings.customRanks.hdr> = {
    DV: "dolbyVision",
    HDR: "hdr",
    "HDR10+": "hdr10plus",
    SDR: "sdr",
  };

  for (const hdrFormat of data.hdr) {
    const key = hdrMap[hdrFormat];

    if (key && !settings.customRanks.hdr[key].fetch) {
      failedKeys.add(`hdr_${key}`);
      return true;
    }
  }
  return false;
}

/**
 * Check if the other data is fetchable based on user settings.
 */
function fetchOther(
  data: ParsedData,
  settings: SettingsModel,
  failedKeys: Set<string>,
): boolean {
  const fetchMap: [
    keyof ParsedData,
    keyof typeof settings.customRanks,
    string,
  ][] = [
    ["is3d", "extras", "three_d"],
    ["converted", "extras", "converted"],
    ["documentary", "extras", "documentary"],
    ["dubbed", "extras", "dubbed"],
    ["edition", "extras", "edition"],
    ["hardcoded", "extras", "hardcoded"],
    ["network", "extras", "network"],
    ["proper", "extras", "proper"],
    ["repack", "extras", "repack"],
    ["retail", "extras", "retail"],
    ["subbed", "extras", "subbed"],
    ["upscaled", "extras", "upscaled"],
    ["site", "extras", "site"],
    ["size", "trash", "size"],
    ["bitDepth", "hdr", "bit10"],
    ["scene", "extras", "scene"],
    ["uncensored", "extras", "uncensored"],
  ];

  for (const [attr, category, key] of fetchMap) {
    const value = data[attr];

    if (value) {
      const customRankCategory = settings.customRanks[category] as Record<
        string,
        { fetch: boolean }
      >;

      if (customRankCategory[key] && !customRankCategory[key].fetch) {
        failedKeys.add(`${category}_${key}`);

        return true;
      }
    }
  }
  return false;
}
