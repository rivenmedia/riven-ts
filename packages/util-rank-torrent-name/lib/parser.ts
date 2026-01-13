/**
 * Parser module for parsing torrent titles and extracting metadata.
 *
 * Uses `parse-torrent-title` npm package for initial parsing and enriches
 * the data with additional metadata.
 */
import ptt from "parse-torrent-title";

import { GarbageTorrent, SettingsDisabled } from "./exceptions.ts";
import { getLevRatio } from "./extras.ts";
import { checkFetch } from "./fetch.ts";
import {
  type BaseRankingModel,
  type ParsedData,
  ParsedDataSchema,
  type SettingsModel,
  type Torrent,
  createDefaultRanking,
  createDefaultSettings,
  createTorrent,
} from "./models.ts";
import { normalizeTitle } from "./patterns.ts";
import { getRank } from "./ranker.ts";

/**
 * Map parse-torrent-title source to RTN quality format.
 */
function mapSourceToQuality(source?: string): string | null {
  if (!source) {
    return null;
  }

  const sourceMap: Record<string, string> = {
    bluray: "BluRay",
    bdrip: "BDRip",
    brrip: "BRRip",
    "web-dl": "WEB-DL",
    webdl: "WEB-DL",
    webrip: "WEBRip",
    web: "WEB",
    hdtv: "HDTV",
    dvdrip: "DVDRip",
    dvd: "DVD",
    hdrip: "HDRip",
    cam: "CAM",
    hdcam: "CAM",
    telesync: "TeleSync",
    ts: "TeleSync",
    telecine: "TeleCine",
    tc: "TeleCine",
    ppvrip: "PPVRip",
    dvdscr: "SCR",
    screener: "SCR",
    r5: "R5",
    pdtv: "PDTV",
    tvrip: "TVRip",
    hdtvrip: "TVRip",
    satrip: "SATRip",
    vhsrip: "VHSRip",
    webmux: "WEBMux",
    dlmux: "WEBMux",
    bdmux: "WEBMux",
    brmux: "WEBMux",
    uhdrip: "UHDRip",
  };

  return sourceMap[source.toLowerCase()] ?? null;
}

/**
 * Map parse-torrent-title codec to RTN codec format.
 */
function mapCodec(codec?: string): string | null {
  if (!codec) return null;

  const codecMap: Record<string, string> = {
    x264: "AVC",
    h264: "AVC",
    avc: "AVC",
    x265: "HEVC",
    h265: "HEVC",
    hevc: "HEVC",
    xvid: "XviD",
    divx: "DivX",
    av1: "AV1",
    mpeg2: "MPEG",
    mpeg: "MPEG",
  };

  return codecMap[codec.toLowerCase()] ?? codec.toUpperCase();
}

/**
 * Map parse-torrent-title audio to RTN audio format.
 */
function mapAudio(audio?: string): string[] {
  if (!audio) return [];

  const audioMap: Record<string, string> = {
    aac: "AAC",
    ac3: "Dolby Digital",
    dd: "Dolby Digital",
    eac3: "Dolby Digital Plus",
    ddp: "Dolby Digital Plus",
    dts: "DTS Lossy",
    "dts-hd": "DTS Lossy",
    "dts-hd-ma": "DTS Lossless",
    truehd: "TrueHD",
    atmos: "Atmos",
    flac: "FLAC",
    mp3: "MP3",
    "dual-audio": "Dual Audio",
    md: "MD",
  };

  const mapped = audioMap[audio.toLowerCase()];
  return mapped ? [mapped] : [audio.toUpperCase()];
}

/**
 * Map resolution to standard format.
 */
function mapResolution(resolution?: string): string {
  if (!resolution) {
    return "unknown";
  }

  const resMap: Record<string, string> = {
    "4k": "2160p",
    "2160p": "2160p",
    "1440p": "1440p",
    "1080p": "1080p",
    "720p": "720p",
    "576p": "576p",
    "480p": "480p",
    "360p": "360p",
  };

  return resMap[resolution.toLowerCase()] ?? resolution.toLowerCase();
}

/**
 * Map channels to standard format.
 */
function mapChannels(channels?: number | string): string[] {
  if (!channels) return [];

  const channelStr = String(channels);
  if (channelStr === "5.1" || channelStr === "6") return ["5.1"];
  if (channelStr === "7.1" || channelStr === "8") return ["7.1"];
  if (channelStr === "2.0" || channelStr === "2") return ["2.0"];
  if (channelStr === "1.0" || channelStr === "1") return ["mono"];

  return [channelStr];
}

/**
 * Extract HDR information from the title.
 */
function extractHdr(rawTitle: string): string[] {
  const hdr: string[] = [];

  // Dolby Vision - check first as it's more specific
  if (/\b(DV|DOVI|DOLBY[\s.-]?VISION)\b/i.test(rawTitle)) {
    hdr.push("DV");
  }

  // HDR10+ - check before HDR10 and HDR
  if (/\bHDR10\+|\bHDR10PLUS\b/i.test(rawTitle)) {
    hdr.push("HDR10+");
  }
  // HDR10 - check before generic HDR
  else if (/\bHDR10\b/i.test(rawTitle) && !hdr.includes("HDR10+")) {
    hdr.push("HDR");
  }
  // Generic HDR
  else if (
    /\bHDR\b/i.test(rawTitle) &&
    !hdr.includes("HDR") &&
    !hdr.includes("HDR10+")
  ) {
    hdr.push("HDR");
  }

  return hdr;
}

/**
 * Extract languages from the title.
 */
function extractLanguages(rawTitle: string): string[] {
  const languages: string[] = [];

  // Language code patterns
  const langPatterns: Record<string, RegExp> = {
    en: /\b(english|eng|en)\b/i,
    fr: /\b(french|fra|fre|fr|vostfr|vff|truefrench)\b/i,
    es: /\b(spanish|esp|spa|es|español|latino)\b/i,
    de: /\b(german|ger|deu|de)\b/i,
    it: /\b(italian|ita|it)\b/i,
    pt: /\b(portuguese|por|pt|pt-br)\b/i,
    ru: /\b(russian|rus|ru)\b/i,
    ja: /\b(japanese|jpn|ja|jp)\b/i,
    ko: /\b(korean|kor|ko|kr)\b/i,
    zh: /\b(chinese|chi|zh|cn|mandarin|cantonese)\b/i,
    hi: /\b(hindi|hin|hi)\b/i,
    ar: /\b(arabic|ara|ar)\b/i,
    nl: /\b(dutch|nld|nl)\b/i,
    pl: /\b(polish|pol|pl)\b/i,
    tr: /\b(turkish|tur|tr)\b/i,
    sv: /\b(swedish|swe|sv)\b/i,
    no: /\b(norwegian|nor|no)\b/i,
    da: /\b(danish|dan|da)\b/i,
    fi: /\b(finnish|fin|fi)\b/i,
    cs: /\b(czech|ces|cze|cs)\b/i,
    hu: /\b(hungarian|hun|hu)\b/i,
    ro: /\b(romanian|ron|ro)\b/i,
    el: /\b(greek|ell|el)\b/i,
    he: /\b(hebrew|heb|he)\b/i,
    th: /\b(thai|tha|th)\b/i,
    vi: /\b(vietnamese|vie|vi)\b/i,
    id: /\b(indonesian|ind|id)\b/i,
    ta: /\b(tamil|tam|ta)\b/i,
    te: /\b(telugu|tel|te)\b/i,
  };

  for (const [code, pattern] of Object.entries(langPatterns)) {
    if (pattern.test(rawTitle)) {
      languages.push(code);
    }
  }

  return languages;
}

/**
 * Extract seasons from the title including season packs.
 */
function extractSeasons(rawTitle: string): number[] {
  const seasons: number[] = [];

  // Standard season patterns: S01, Season 1, etc.
  const standardPattern = /\bS(?:eason\s*)?(\d{1,2})\b/gi;

  let match;

  while ((match = standardPattern.exec(rawTitle)) !== null) {
    const season = parseInt(match[1] ?? "", 10);

    if (!seasons.includes(season)) {
      seasons.push(season);
    }
  }

  // Season range patterns: S01-S08, Seasons 1-8, Season 1 to 8, (1-8)
  const rangePatterns = [
    /\bS(?:eason\s*)?(\d{1,2})\s*[-–—]\s*S?(?:eason\s*)?(\d{1,2})\b/gi,
    /\bSeasons?\s+(\d{1,2})\s*[-–—to]+\s*(\d{1,2})\b/gi,
    /\bAll\s+Seasons?\s*\((\d{1,2})\s*[-–—]\s*(\d{1,2})\)/gi,
    /\((\d{1,2})\s*[-–—]\s*(\d{1,2})\)/gi,
    // Portuguese: 1ª a 8ª Temporada
    /(\d{1,2})ª?\s*a\s*(\d{1,2})ª?\s*Temporada/gi,
    // Generic "X a Y" or "X-Y" in Temporada context
    /Temporada[s]?\s*(\d{1,2})\s*[-–—a]+\s*(\d{1,2})/gi,
    // Season 1 to 6, Season 1-6
    /Season\s*(\d{1,2})\s*[-–—to]+\s*(\d{1,2})/gi,
  ];

  for (const pattern of rangePatterns) {
    pattern.lastIndex = 0;

    while ((match = pattern.exec(rawTitle)) !== null) {
      const start = parseInt(match[1] ?? "", 10);
      const end = parseInt(match[2] ?? "", 10);

      if (start > 0 && end > 0 && end >= start && end <= 50) {
        for (let i = start; i <= end; i++) {
          if (!seasons.includes(i)) {
            seasons.push(i);
          }
        }
      }
    }
  }

  // 6x05 style (season x episode)
  const altPattern = /\b(\d{1,2})x(\d{1,3})\b/gi;

  while ((match = altPattern.exec(rawTitle)) !== null) {
    const season = parseInt(match[1] ?? "", 10);

    if (season > 0 && season <= 50 && !seasons.includes(season)) {
      seasons.push(season);
    }
  }

  return seasons.sort((a, b) => a - b);
}

/**
 * Extract episodes from the title.
 */
function extractEpisodes(rawTitle: string): number[] {
  const episodes: number[] = [];

  let match;

  // Multiple episodes: E01E02E03 (check first to avoid partial matches)
  const multiPattern =
    /\bE(\d{1,3})E(\d{1,3})(?:E(\d{1,3}))?(?:E(\d{1,3}))?\b/gi;

  while ((match = multiPattern.exec(rawTitle)) !== null) {
    for (let i = 1; i < match.length; i++) {
      if (match[i]) {
        const ep = parseInt(match[i] ?? "", 10);

        if (ep > 0 && ep <= 9999 && !episodes.includes(ep)) {
          episodes.push(ep);
        }
      }
    }
  }

  // Range pattern with explicit E: E01-E05 (must have E before second number)
  const explicitRangePattern = /\bE(\d{1,3})\s*[-–—]\s*E(\d{1,3})\b/gi;

  while ((match = explicitRangePattern.exec(rawTitle)) !== null) {
    const start = parseInt(match[1] ?? "", 10);
    const end = parseInt(match[2] ?? "", 10);

    if (start > 0 && end >= start && end <= 9999) {
      for (let i = start; i <= end; i++) {
        if (!episodes.includes(i)) {
          episodes.push(i);
        }
      }
    }
  }

  // Range pattern without E: E01-05 (only if the numbers are close, within 50)
  const implicitRangePattern = /\bE(\d{1,3})\s*[-–—]\s*(\d{1,3})\b/gi;

  while ((match = implicitRangePattern.exec(rawTitle)) !== null) {
    // Skip if we already have an explicit E pattern match (E01-E05)
    if (/\bE\d{1,3}\s*[-–—]\s*E\d{1,3}\b/i.test(match[0])) continue;

    const start = parseInt(match[1] ?? "", 10);
    const end = parseInt(match[2] ?? "", 10);

    // Only treat as range if the end is within 50 of start (reasonable episode range)
    if (start > 0 && end >= start && end - start <= 50 && end <= 9999) {
      for (let i = start; i <= end; i++) {
        if (!episodes.includes(i)) {
          episodes.push(i);
        }
      }
    }
  }

  // Standard episode patterns: E01 (but not followed by range or more episodes)
  const ePattern = /\bE(\d{1,3})(?![E\d])\b/gi;

  while ((match = ePattern.exec(rawTitle)) !== null) {
    const ep = parseInt(match[1] ?? "", 10);

    if (ep > 0 && ep <= 9999 && !episodes.includes(ep)) {
      episodes.push(ep);
    }
  }

  // 6x05 style (season x episode) - only extract the episode (second group)
  const altPattern = /\b\d{1,2}x(\d{1,3})\b/gi;

  while ((match = altPattern.exec(rawTitle)) !== null) {
    const ep = parseInt(match[1] ?? "", 10);

    if (ep > 0 && ep <= 9999 && !episodes.includes(ep)) {
      episodes.push(ep);
    }
  }

  // Anime-style: - 087 - (episode number between dashes)
  // Skip if "movie" is in the title as this is likely a movie number not episode
  if (!/\bmovie\b/i.test(rawTitle)) {
    const animePattern = /\s-\s(\d{2,4})\s-\s/g;

    while ((match = animePattern.exec(rawTitle)) !== null) {
      const ep = parseInt(match[1] ?? "", 10);

      if (ep > 0 && ep <= 9999 && !episodes.includes(ep)) {
        episodes.push(ep);
      }
    }
  }

  // Mini-series style: 2Of4
  const miniPattern = /\b(\d{1,2})Of\d{1,2}\b/gi;

  while ((match = miniPattern.exec(rawTitle)) !== null) {
    const ep = parseInt(match[1] ?? "", 10);

    if (ep > 0 && ep <= 999 && !episodes.includes(ep)) {
      episodes.push(ep);
    }
  }

  return episodes.sort((a, b) => a - b);
}

/**
 * Detect if torrent is trash quality.
 */
function detectTrash(rawTitle: string, quality: string | null): boolean {
  const trashQualities = ["CAM", "PDTV", "R5", "SCR", "TeleCine", "TeleSync"];

  if (quality && trashQualities.includes(quality)) {
    return true;
  }

  // Additional trash patterns
  const trashPatterns = [
    /\b(HDTS|HD-?TS|HD-?CAM|CAMRip|HDCAM|HC|HQ-?CAM|TELESYNC|TS|TELECINE|TC|DVDSCR|DVDScreener|SCR|R5|LINE)\b/i,
    /\b(HDTC|HQ\s*Clean\s*Audio)\b/i,
  ];

  for (const pattern of trashPatterns) {
    if (pattern.test(rawTitle)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect adult content.
 */
function detectAdult(rawTitle: string): boolean {
  const adultPatterns = [
    /\b(xxx|porn|xvideos|pornhub|brazzers|bangbros|vrporn|hentai|JAV)\b/i,
  ];

  for (const pattern of adultPatterns) {
    if (pattern.test(rawTitle)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect dubbed content.
 */
function detectDubbed(rawTitle: string): boolean {
  const dubbedPatterns = [
    /\bDUAL\b/i,
    /\bDual[\s.-]*Audio\b/i,
    /\bDubbed\b/i,
    /\bMULTi\b/i,
  ];

  for (const pattern of dubbedPatterns) {
    if (pattern.test(rawTitle)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract site/source from title.
 */
function extractSite(rawTitle: string): string | null {
  // Look for www.* or http(s):// patterns anywhere in the title
  const patterns = [
    /\b(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i,
    /https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ];

  for (const pattern of patterns) {
    const match = rawTitle.match(pattern);

    if (match) {
      return match[1] ?? null;
    }
  }

  return null;
}

/**
 * Extract size from title.
 */
function extractSize(rawTitle: string): string | null {
  const sizePattern = /\b(\d+(?:\.\d+)?)\s*(GB|MB|TB)\b/i;
  const match = sizePattern.exec(rawTitle);

  return match ? `${match[1] ?? ""}${(match[2] ?? "").toUpperCase()}` : null;
}

/**
 * Parse a torrent title and extract metadata.
 */
export function parse(rawTitle: string): ParsedData {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const parsed = ptt.parse(rawTitle);

  // Extract additional data that parse-torrent-title might miss
  const hdr = extractHdr(rawTitle);
  const languages = extractLanguages(rawTitle);
  const seasons = extractSeasons(rawTitle);
  const episodes = extractEpisodes(rawTitle);
  const site = extractSite(rawTitle);
  const size = extractSize(rawTitle);

  // Detect special quality patterns that parse-torrent-title might miss
  let quality = parsed.remux ? "REMUX" : mapSourceToQuality(parsed.source);

  // Check for WEB-DLRip specifically (not caught by ptt)
  if (/\bWEB-?DL-?Rip\b/i.test(rawTitle)) {
    quality = "WEB-DLRip";
  }

  const trash = detectTrash(rawTitle, quality);
  const adult = detectAdult(rawTitle);
  const dubbed = detectDubbed(rawTitle);

  // Use ptt results if our extraction didn't find anything
  const finalSeasons =
    seasons.length > 0
      ? seasons
      : parsed.season !== undefined
        ? [parsed.season]
        : [];

  const finalEpisodes =
    episodes.length > 0
      ? episodes
      : parsed.episode !== undefined
        ? [parsed.episode]
        : [];

  // Build the parsed data object
  return ParsedDataSchema.parse({
    rawTitle,
    parsedTitle: parsed.title || "",
    normalizedTitle: normalizeTitle(parsed.title || ""),
    year: parsed.year ?? null,
    resolution: mapResolution(parsed.resolution),
    seasons: finalSeasons,
    episodes: finalEpisodes,
    quality,
    codec: mapCodec(parsed.codec),
    audio: mapAudio(parsed.audio),
    channels: mapChannels(parsed.channels),
    group: parsed.group ?? null,
    extended: parsed.extended ?? false,
    hardcoded: parsed.hardcoded ?? false,
    proper: parsed.proper ?? false,
    repack: parsed.repack ?? false,
    retail: parsed.retail ?? false,
    remastered: parsed.remastered ?? false,
    unrated: parsed.unrated ?? false,
    region: parsed.region ?? null,
    container: parsed.container ?? null,
    extension: parsed.container ?? null,
    bitDepth: parsed.bitdepth ? `${parsed.bitdepth.toString()}bit` : null,
    converted: parsed.convert ?? false,
    hdr,
    languages,
    trash,
    adult,
    dubbed,
    site,
    size,
  });
}

/**
 * RTN (Rank Torrent Name) class for parsing and ranking torrent titles.
 */
export class RTN {
  private settings: SettingsModel;
  private rankingModel: BaseRankingModel;
  private levThreshold: number;

  /**
   * Initialize the RTN class with settings and a ranking model.
   *
   * @param settings - The settings model with user preferences
   * @param rankingModel - The model defining ranking logic (optional, defaults to DefaultRanking)
   */
  constructor(settings?: SettingsModel, rankingModel?: BaseRankingModel) {
    this.settings = settings ?? createDefaultSettings();
    this.rankingModel = rankingModel ?? createDefaultRanking();
    this.levThreshold = this.settings.options.titleSimilarity;
  }

  /**
   * Parse a torrent title, compute its rank, and return a Torrent object.
   *
   * @param rawTitle - The original title of the torrent
   * @param infohash - The SHA-1 hash identifier of the torrent
   * @param correctTitle - The correct title to compare against (optional)
   * @param removeTrash - Whether to raise error for trash torrents (default: false)
   * @param speedMode - Whether to use speed mode for fetching (default: true)
   * @param aliases - Optional aliases for title matching
   * @returns Torrent object with metadata and ranking
   *
   * @throws SettingsDisabled - If settings are disabled
   * @throws GarbageTorrent - If torrent is identified as trash
   */
  rank(
    rawTitle: string,
    infohash: string,
    correctTitle = "",
    removeTrash = false,
    speedMode = true,
    aliases: Record<string, string[]> = {},
  ): Torrent {
    if (!this.settings.enabled) {
      throw new SettingsDisabled("Settings are disabled and cannot be used.");
    }

    if (!rawTitle || !infohash) {
      throw new Error("Both the title and infohash must be provided.");
    }

    if (infohash.length !== 40) {
      throw new GarbageTorrent(
        "The infohash must be a valid SHA-1 hash and 40 characters in length.",
      );
    }

    const parsedData = parse(rawTitle);

    const levRatio = correctTitle
      ? getLevRatio(
          correctTitle,
          parsedData.parsedTitle,
          this.levThreshold,
          aliases,
        )
      : 0;

    if (correctTitle) {
      if (removeTrash && levRatio < this.levThreshold) {
        throw new GarbageTorrent(
          `'${rawTitle}' does not match the correct title. ` +
            `correct title: '${correctTitle}', parsed title: '${parsedData.parsedTitle}'`,
        );
      }
    }

    const { fetch: isFetchable, failedKeys } = checkFetch(
      parsedData,
      this.settings,
      speedMode,
    );

    const rank = getRank(parsedData, this.settings, this.rankingModel);

    if (removeTrash) {
      if (!isFetchable) {
        throw new GarbageTorrent(
          `'${parsedData.rawTitle}' denied by: ${failedKeys.join(", ")}`,
        );
      }

      if (rank < this.settings.options.removeRanksUnder) {
        throw new GarbageTorrent(
          `'${rawTitle}' does not meet the minimum rank requirement, got rank of ${rank.toString()}`,
        );
      }
    }

    return createTorrent({
      infohash,
      rawTitle,
      data: parsedData,
      fetch: isFetchable,
      rank,
      levRatio,
    });
  }

  /**
   * Get the current settings.
   */
  getSettings(): SettingsModel {
    return this.settings;
  }

  /**
   * Get the current ranking model.
   */
  getRankingModel(): BaseRankingModel {
    return this.rankingModel;
  }

  /**
   * Update settings.
   */
  setSettings(settings: SettingsModel): void {
    this.settings = settings;
    this.levThreshold = settings.options.titleSimilarity;
  }

  /**
   * Update ranking model.
   */
  setRankingModel(rankingModel: BaseRankingModel): void {
    this.rankingModel = rankingModel;
  }
}
