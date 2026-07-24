import {
  allLanguages,
  animeLanguages,
  commonLanguages,
  nonAnimeLanguages,
} from "./languages.ts";

import type {
  RankingModel,
  ResolutionConfig,
} from "../ranker/ranking-settings.schema.ts";
import type { Resolution } from "../schemas.ts";

export const QUALITY_MAP = new Map<string, keyof RankingModel>([
  // Quality
  ["web", "web"],
  ["web-dl", "webdl"],
  ["bluray", "bluray"],
  ["hdtv", "hdtv"],
  ["vhs", "vhs"],
  ["webmux", "webmux"],
  ["bluray remux", "remux"],
  ["remux", "remux"],
  ["dvd", "dvd"],

  // Rips
  ["webrip", "webrip"],
  ["web-dlrip", "webdlrip"],
  ["uhdrip", "uhdrip"],
  ["hdrip", "hdrip"],
  ["dvdrip", "dvdrip"],
  ["bdrip", "bdrip"],
  ["brrip", "brrip"],
  ["vhsrip", "vhsrip"],
  ["ppvrip", "ppvrip"],
  ["satrip", "satrip"],
  ["tvrip", "tvrip"],

  // Trash
  ["telecine", "telecine"],
  ["telesync", "telesync"],
  ["screener", "screener"],
  ["r5", "r5"],
  ["cam", "cam"],
  ["pdtv", "pdtv"],
]);

export const CODEC_MAP = new Map<string, keyof RankingModel>([
  ["avc", "avc"],
  ["h264", "avc"],
  ["x264", "avc"],
  ["hevc", "hevc"],
  ["h265", "hevc"],
  ["x265", "hevc"],
  ["av1", "av1"],
  ["xvid", "xvid"],
  ["mpeg", "mpeg"],
]);

export const HDR_MAP = new Map<string, keyof RankingModel>([
  ["dv", "dolbyVision"],
  ["hdr", "hdr"],
  ["hdr10+", "hdr10plus"],
  ["sdr", "sdr"],
]);

export const AUDIO_MAP = new Map<string, keyof RankingModel>([
  ["aac", "aac"],
  ["atmos", "atmos"],
  ["dd", "dolbyDigital"],
  ["dolby digital", "dolbyDigital"],
  ["ddp", "dolbyDigitalPlus"],
  ["dolby digital plus", "dolbyDigitalPlus"],
  ["ac3", "dolbyDigital"],
  ["eac3", "dolbyDigitalPlus"],
  ["dts lossy", "dtsLossy"],
  ["dts lossless", "dtsLossless"],
  ["flac", "flac"],
  ["mp3", "mp3"],
  ["truehd", "truehd"],
  ["hq clean audio", "cleanAudio"],
]);

export const CHANNEL_MAP = new Map<string, keyof RankingModel>([
  ["5.1", "surround"],
  ["7.1", "surround"],
  ["stereo", "stereo"],
  ["2.0", "stereo"],
  ["mono", "mono"],
]);

export const FLAG_MAP = new Map<string, keyof RankingModel>([
  ["threeD", "threeD"],
  ["converted", "converted"],
  ["documentary", "documentary"],
  ["dubbed", "dubbed"],
  ["edition", "edition"],
  ["hardcoded", "hardcoded"],
  ["network", "network"],
  ["proper", "proper"],
  ["repack", "repack"],
  ["retail", "retail"],
  ["subbed", "subbed"],
  ["upscaled", "upscaled"],
  ["site", "site"],
  ["size", "size"],
  ["bitDepth", "bit10"],
  ["scene", "scene"],
  ["uncensored", "uncensored"],
]);

// Trash quality values for quick lookup
export const TRASH_QUALITIES = new Set([
  "cam",
  "pdtv",
  "r5",
  "screener",
  "telecine",
  "telesync",
]);

export const RESOLUTION_MAP = new Map<string, Resolution>([
  ["2160p", "2160p"],
  ["4k", "2160p"],
  ["1440p", "1080p"],
  ["1080p", "1080p"],
  ["720p", "720p"],
  ["576p", "480p"],
  ["480p", "480p"],
  ["360p", "360p"],
  ["240p", "360p"],
]);

export const RESOLUTION_SETTINGS_MAP = new Map<
  Resolution,
  keyof ResolutionConfig
>([
  ["2160p", "r2160p"],
  ["1080p", "r1080p"],
  ["720p", "r720p"],
  ["480p", "r480p"],
  ["360p", "r360p"],
  ["unknown", "unknown"],
]);

export const LANG_GROUPS = {
  anime: animeLanguages,
  nonAnime: nonAnimeLanguages,
  common: commonLanguages,
  all: allLanguages,
} as const satisfies Record<string, Set<string>>;
