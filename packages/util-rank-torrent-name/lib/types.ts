export interface CustomFields {
  scene?: boolean;
  trash?: boolean;
  "3d"?: boolean;
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
  failedChecks: string[];
}

export interface RankedResult {
  data: ParsedData;
  rank: number;
  fetch: boolean;
  failedChecks: string[];
}
