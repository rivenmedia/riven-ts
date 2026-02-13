export interface CustomFields {
  adult?: boolean;
  scene?: boolean;
  trash?: boolean;
  country?: string;
  bitrate?: string;
}

export interface ParsedData extends CustomFields {
  // Identity
  rawTitle: string;
  title: string;
  normalizedTitle: string;

  // Metadata
  year?: number;
  resolution: string;
  quality?: string;
  codec?: string;
  bitDepth?: string;

  // Episodes
  seasons: number[];
  episodes: number[];
  complete?: boolean;
  volumes?: number[];

  // Audio/Video
  audio?: string[];
  channels?: string[];
  hdr?: string[];

  // Languages
  languages: string[];

  // Boolean flags
  dubbed?: boolean;
  subbed?: boolean;
  hardcoded?: boolean;
  proper?: boolean;
  repack?: boolean;
  remux?: boolean;
  retail?: boolean;
  upscaled?: boolean;
  remastered?: boolean;
  extended?: boolean;
  converted?: boolean;
  unrated?: boolean;
  uncensored?: boolean;
  documentary?: boolean;
  commentary?: boolean;
  threeD?: boolean;
  ppv?: boolean;

  // Optional metadata
  date?: string;
  group?: string;
  edition?: string;
  network?: string;
  region?: string;
  site?: string;
  size?: string;
  container?: string;
  extension?: string;
  episodeCode?: string;

  // Computed
  type: "movie" | "show";
}

export interface FetchResult {
  fetch: boolean;
  failedChecks: Set<string>;
}

export interface RankedResult {
  data: ParsedData;
  hash: string;
  rank: number;
  fetch: boolean;
  failedChecks: Set<string>;
}

export const Resolution = {
  "2160p": "2160p",
  "1080p": "1080p",
  "1440p": "1080p",
  "720p": "720p",
  "480p": "480p",
  "360p": "360p",
  unknown: "unknown",
} as const;
