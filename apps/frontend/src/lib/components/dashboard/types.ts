export interface DashboardStatistics {
  total_movies: number;
  total_shows: number;
  total_seasons: number;
  total_episodes: number;
  total_items: number;
  incomplete_items: number;
  completion_rate: number;
  states: Record<string, number>;
  activity: Record<string, number>;
  media_year_releases: { year: number; count: number }[];
}

export interface DownloaderService {
  service: string;
  email: string | null;
  username: string | null;
  premium_status: string | null;
  premium_expires_at: string | null;
  premium_days_left: number | null;
  points: number | null;
  total_downloaded_bytes: number | null;
  cooldown_until: string | null;
}

export interface ActivePlaybackSession {
  server: string;
  userName: string | null;
  parentTitle: string | null;
  itemTitle: string;
  itemType: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  playbackState: string;
  playbackMethod: string;
  positionSeconds: number | null;
  durationSeconds: number | null;
  deviceName: string | null;
  clientName: string | null;
  imageUrl: string | null;
}

export interface NntpProviderHealth {
  host: string;
  port: number;
  priority: number;
  isBackup: boolean;
  maxConnections: number;
  openConnections: number;
  idleConnections: number;
  activeConnections: number;
  breakerTripped: boolean;
  cooldownSecondsRemaining: number;
  consecutiveFailures: number;
}

export interface UsenetStreamingHealth {
  cacheBytesUsed: number;
  cacheBytesMax: number;
  cacheEntries: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  fetchesOk: number;
  fetchesFailed: number;
  fetchSuccessRate: number;
  bytesDecoded: number;
  inFlight: number;
  deadSegments: number;
  activeStreams: number;
}

export interface UsenetTitleHealth {
  infoHash: string;
  fileIndex: number;
  mediaItemId: number | null;
  status: string;
  totalSegments: number;
  sampledSegments: number;
  missingSegments: number;
  errorSegments: number;
  missingPct: number;
  checkedAt: number | null;
  repairAttempts: number;
  nextRepairAt: number | null;
  title: string | null;
  subtitle: string | null;
  posterPath: string | null;
  mediaType: string | null;
}

export interface UsenetTitleHealthSummary {
  healthy: number;
  unhealthy: number;
  notIngested: number;
  unknown: number;
  total: number;
}

interface UsenetProviderTraffic {
  host: string;
  bytesDownloaded: number;
  articlesDownloaded: number;
}

interface UsenetDailyTraffic {
  day: string;
  host: string;
  bytesDownloaded: number;
  articlesDownloaded: number;
}

export interface UsenetTraffic {
  providers: UsenetProviderTraffic[];
  daily: UsenetDailyTraffic[];
  totalBytesDownloaded: number;
  totalArticlesDownloaded: number;
}
