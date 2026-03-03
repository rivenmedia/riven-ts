import {
  animeLanguages,
  commonLanguages,
  nonAnimeLanguages,
} from "./languages.ts";

import type {
  CustomRanksConfig,
  RankingModel,
  ResolutionConfig,
} from "../ranker/settings.ts";
import type { Resolution } from "../schemas.ts";

export const QUALITY_MAP = new Map<
  string,
  [keyof CustomRanksConfig, keyof RankingModel]
>([
  // Quality
  ["web", ["quality", "web"]],
  ["web-dl", ["quality", "webdl"]],
  ["bluray", ["quality", "bluray"]],
  ["hdtv", ["quality", "hdtv"]],
  ["vhs", ["quality", "vhs"]],
  ["webmux", ["quality", "webmux"]],
  ["bluray remux", ["quality", "remux"]],
  ["remux", ["quality", "remux"]],
  ["dvd", ["quality", "dvd"]],

  // Rips
  ["webrip", ["rips", "webrip"]],
  ["web-dlrip", ["rips", "webdlrip"]],
  ["uhdrip", ["rips", "uhdrip"]],
  ["hdrip", ["rips", "hdrip"]],
  ["dvdrip", ["rips", "dvdrip"]],
  ["bdrip", ["rips", "bdrip"]],
  ["brrip", ["rips", "brrip"]],
  ["vhsrip", ["rips", "vhsrip"]],
  ["ppvrip", ["rips", "ppvrip"]],
  ["satrip", ["rips", "satrip"]],
  ["tvrip", ["rips", "tvrip"]],

  // Trash
  ["telecine", ["trash", "telecine"]],
  ["telesync", ["trash", "telesync"]],
  ["screener", ["trash", "screener"]],
  ["r5", ["trash", "r5"]],
  ["cam", ["trash", "cam"]],
  ["pdtv", ["trash", "pdtv"]],
]);

export const CODEC_MAP = new Map<
  string,
  [keyof CustomRanksConfig, keyof RankingModel]
>([
  ["avc", ["quality", "avc"]],
  ["h264", ["quality", "avc"]],
  ["x264", ["quality", "avc"]],
  ["hevc", ["quality", "hevc"]],
  ["h265", ["quality", "hevc"]],
  ["x265", ["quality", "hevc"]],
  ["av1", ["quality", "av1"]],
  ["xvid", ["quality", "xvid"]],
  ["mpeg", ["quality", "mpeg"]],
]);

export const HDR_MAP = new Map<
  string,
  [keyof CustomRanksConfig, keyof RankingModel]
>([
  ["dv", ["hdr", "dolbyVision"]],
  ["hdr", ["hdr", "hdr"]],
  ["hdr10+", ["hdr", "hdr10plus"]],
  ["sdr", ["hdr", "sdr"]],
]);

export const AUDIO_MAP = new Map<
  string,
  [keyof CustomRanksConfig, keyof RankingModel]
>([
  ["aac", ["audio", "aac"]],
  ["atmos", ["audio", "atmos"]],
  ["dd", ["audio", "dolbyDigital"]],
  ["dolby digital", ["audio", "dolbyDigital"]],
  ["ddp", ["audio", "dolbyDigitalPlus"]],
  ["dolby digital plus", ["audio", "dolbyDigitalPlus"]],
  ["ac3", ["audio", "dolbyDigital"]],
  ["eac3", ["audio", "dolbyDigitalPlus"]],
  ["dts lossy", ["audio", "dtsLossy"]],
  ["dts lossless", ["audio", "dtsLossless"]],
  ["flac", ["audio", "flac"]],
  ["mp3", ["audio", "mp3"]],
  ["truehd", ["audio", "truehd"]],
  ["hq clean audio", ["trash", "cleanAudio"]],
]);

export const CHANNEL_MAP = new Map<
  string,
  [keyof CustomRanksConfig, keyof RankingModel]
>([
  ["5.1", ["audio", "surround"]],
  ["7.1", ["audio", "surround"]],
  ["stereo", ["audio", "stereo"]],
  ["2.0", ["audio", "stereo"]],
  ["mono", ["audio", "mono"]],
]);

export const FLAG_MAP = new Map<
  string,
  [keyof CustomRanksConfig, keyof RankingModel]
>([
  ["threeD", ["extras", "threeD"]],
  ["converted", ["extras", "converted"]],
  ["documentary", ["extras", "documentary"]],
  ["dubbed", ["extras", "dubbed"]],
  ["edition", ["extras", "edition"]],
  ["hardcoded", ["extras", "hardcoded"]],
  ["network", ["extras", "network"]],
  ["proper", ["extras", "proper"]],
  ["repack", ["extras", "repack"]],
  ["retail", ["extras", "retail"]],
  ["subbed", ["extras", "subbed"]],
  ["upscaled", ["extras", "upscaled"]],
  ["site", ["extras", "site"]],
  ["size", ["trash", "size"]],
  ["bitDepth", ["hdr", "bit10"]],
  ["scene", ["extras", "scene"]],
  ["uncensored", ["extras", "uncensored"]],
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
  all: new Set<string>([
    ...animeLanguages,
    ...nonAnimeLanguages,
    ...commonLanguages,
  ]),
} as const satisfies Record<string, Set<string>>;
