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

import type { DefaultParserResult } from "parse-torrent-title";

/**
 * Map parse-torrent-title source to RTN quality format.
 */
function mapSourceToQuality(source?: string): string | null {
  if (!source) return null;

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
  if (!resolution) return "unknown";

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
 * Parse a torrent title and extract metadata.
 */
export function parse(rawTitle: string): ParsedData {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const parsed: DefaultParserResult = ptt.parse(rawTitle);

  // Build the parsed data object
  return ParsedDataSchema.parse({
    rawTitle,
    parsedTitle: parsed.title || "",
    normalizedTitle: normalizeTitle(parsed.title || ""),
    year: parsed.year ?? null,
    resolution: mapResolution(parsed.resolution),
    seasons: parsed.season !== undefined ? [parsed.season] : [],
    episodes: parsed.episode !== undefined ? [parsed.episode] : [],
    quality: mapSourceToQuality(parsed.source),
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
    bitDepth: parsed.bitdepth ? String(parsed.bitdepth) : null,
    // Additional fields that parse-torrent-title might provide
    converted: parsed.convert ?? false,
    // Check for remux in source
    ...(parsed.remux && { quality: "REMUX" }),
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

    let levRatio = 0.0;
    if (correctTitle) {
      levRatio = getLevRatio(
        correctTitle,
        parsedData.parsedTitle,
        this.levThreshold,
        aliases,
      );
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
