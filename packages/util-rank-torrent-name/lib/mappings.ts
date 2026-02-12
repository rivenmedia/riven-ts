// Maps parsed values to [settingsCategory, settingsKey]
// Used by both rank() and checkFetch()

export const QUALITY_MAP = new Map<string, [string, string]>([
  // Quality
  ["WEB", ["quality", "web"]],
  ["WEB-DL", ["quality", "webdl"]],
  ["BluRay", ["quality", "bluray"]],
  ["HDTV", ["quality", "hdtv"]],
  ["VHS", ["quality", "vhs"]],
  ["WEBMux", ["quality", "webmux"]],
  ["BluRay REMUX", ["quality", "remux"]],
  ["REMUX", ["quality", "remux"]],
  ["DVD", ["quality", "dvd"]],

  // Rips
  ["WEBRip", ["rips", "webrip"]],
  ["WEB-DLRip", ["rips", "webdlrip"]],
  ["UHDRip", ["rips", "uhdrip"]],
  ["HDRip", ["rips", "hdrip"]],
  ["DVDRip", ["rips", "dvdrip"]],
  ["BDRip", ["rips", "bdrip"]],
  ["BRRip", ["rips", "brrip"]],
  ["VHSRip", ["rips", "vhsrip"]],
  ["PPVRip", ["rips", "ppvrip"]],
  ["SATRip", ["rips", "satrip"]],
  ["TVRip", ["rips", "tvrip"]],

  // Trash
  ["TeleCine", ["trash", "telecine"]],
  ["TeleSync", ["trash", "telesync"]],
  ["SCR", ["trash", "screener"]],
  ["R5", ["trash", "r5"]],
  ["CAM", ["trash", "cam"]],
  ["PDTV", ["trash", "pdtv"]],
]);

export const CODEC_MAP = new Map<string, [string, string]>([
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

export const HDR_MAP = new Map<string, [string, string]>([
  ["DV", ["hdr", "dolbyVision"]],
  ["HDR", ["hdr", "hdr"]],
  ["HDR10+", ["hdr", "hdr10plus"]],
  ["SDR", ["hdr", "sdr"]],
]);

export const AUDIO_MAP = new Map<string, [string, string]>([
  ["AAC", ["audio", "aac"]],
  ["Atmos", ["audio", "atmos"]],
  ["Dolby Digital", ["audio", "dolbyDigital"]],
  ["Dolby Digital Plus", ["audio", "dolbyDigitalPlus"]],
  ["DTS Lossy", ["audio", "dtsLossy"]],
  ["DTS Lossless", ["audio", "dtsLossless"]],
  ["FLAC", ["audio", "flac"]],
  ["MP3", ["audio", "mp3"]],
  ["TrueHD", ["audio", "truehd"]],
  ["HQ Clean Audio", ["trash", "cleanAudio"]],
]);

export const CHANNEL_MAP = new Map<string, [string, string]>([
  ["5.1", ["audio", "surround"]],
  ["7.1", ["audio", "surround"]],
  ["stereo", ["audio", "stereo"]],
  ["2.0", ["audio", "stereo"]],
  ["mono", ["audio", "mono"]],
]);

// Boolean flags on ParsedData -> [settingsCategory, settingsKey]
export const FLAG_MAP = new Map<string, [string, string]>([
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
  "CAM",
  "PDTV",
  "R5",
  "SCR",
  "TeleCine",
  "TeleSync",
]);

// Resolution normalization map
export const RESOLUTION_MAP = new Map<string, string>([
  ["2160p", "2160p"],
  ["4k", "2160p"],
  ["1080p", "1080p"],
  ["1440p", "1080p"],
  ["720p", "720p"],
  ["480p", "480p"],
  ["576p", "480p"],
  ["360p", "360p"],
  ["240p", "360p"],
]);

// Resolution key to settings field name
export const RESOLUTION_SETTINGS_MAP = new Map<string, string>([
  ["2160p", "r2160p"],
  ["1080p", "r1080p"],
  ["720p", "r720p"],
  ["480p", "r480p"],
  ["360p", "r360p"],
  ["unknown", "unknown"],
]);

// Language groups
export const LANG_GROUPS = {
  anime: new Set(["ja", "zh", "ko"]),
  non_anime: new Set([
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
  ]),
  common: new Set([
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
  ]),
  all: new Set<string>(),
} as const satisfies Record<string, Set<string>>;

for (const group of [...LANG_GROUPS.anime, ...LANG_GROUPS.non_anime]) {
  LANG_GROUPS.all.add(group);
}
