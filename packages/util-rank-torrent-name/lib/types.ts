export interface ParsedData {
  // Identity
  rawTitle: string;
  title: string;
  normalizedTitle: string;

  // Metadata
  year: number | undefined;
  resolution: string;
  quality: string | undefined;
  codec: string | undefined;
  bitDepth: string | undefined;

  // Episodes
  seasons: number[];
  episodes: number[];
  complete: boolean;
  volumes: number[];

  // Audio/Video
  audio: string[];
  channels: string[];
  hdr: string[];

  // Languages
  languages: string[];

  // Boolean flags
  dubbed: boolean;
  subbed: boolean;
  hardcoded: boolean;
  proper: boolean;
  repack: boolean;
  remux: boolean;
  retail: boolean;
  upscaled: boolean;
  remastered: boolean;
  extended: boolean;
  converted: boolean;
  unrated: boolean;
  uncensored: boolean;
  documentary: boolean;
  commentary: boolean;
  threeD: boolean;
  ppv: boolean;

  // Optional metadata
  date: string | undefined;
  group: string | undefined;
  edition: string | undefined;
  network: string | undefined;
  region: string | undefined;
  site: string | undefined;
  size: string | undefined;
  container: string | undefined;
  extension: string | undefined;
  episodeCode: string | undefined;

  // Computed
  type: "movie" | "show";
}

export interface FetchResult {
  fetch: boolean;
  failedChecks: string[];
}

export interface RankedResult {
  data: ParsedData;
  rank: number;
  fetch: boolean;
  failedChecks: string[];
}
