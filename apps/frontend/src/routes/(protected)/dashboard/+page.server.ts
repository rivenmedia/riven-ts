import { gql } from "$lib/graphql-client";
import { createScopedLogger } from "$lib/logger";
import { getTimestamp } from "$lib/utils/date";
import { DateTime } from "luxon";

import type {
  ActivePlaybackSession,
  DownloaderService,
  NntpProviderHealth,
  UsenetStreamingHealth,
  UsenetTitleHealth,
  UsenetTitleHealthSummary,
  UsenetTraffic,
} from "$lib/components/dashboard/types";
import type { PageServerLoad } from "./$types";

const logger = createScopedLogger("dashboard");
const DASHBOARD_STATS_DEPENDENCY = "riven:dashboard-stats";

const STATS_QUERY = `
    query {
        stats {
            totalMovies
            totalShows
            totalSeasons
            totalEpisodes
            totalItems
            incompleteItems
            completionRate
            completed
            scraped
            indexed
            failed
            paused
            ongoing
            partiallyCompleted
            unreleased
        }
        activity
        yearReleases {
            year
            count
        }
    }
`;

const ACTIVE_PLAYBACK_QUERY = `
    query {
        activePlaybackSessions {
            server
            userName
            parentTitle
            itemTitle
            itemType
            seasonNumber
            episodeNumber
            playbackState
            playbackMethod
            positionSeconds
            durationSeconds
            deviceName
            clientName
            imageUrl
        }
    }
`;

const USENET_HEALTH_QUERY = `
    query {
        nntpProviders {
            host
            port
            priority
            isBackup
            maxConnections
            openConnections
            idleConnections
            activeConnections
            breakerTripped
            cooldownSecondsRemaining
            consecutiveFailures
        }
        usenetStreamingHealth {
            cacheBytesUsed
            cacheBytesMax
            cacheEntries
            cacheHits
            cacheMisses
            cacheHitRate
            fetchesOk
            fetchesFailed
            fetchSuccessRate
            bytesDecoded
            inFlight
            deadSegments
            activeStreams
        }
        usenetTitleHealth {
            infoHash
            fileIndex
            mediaItemId
            status
            totalSegments
            sampledSegments
            missingSegments
            errorSegments
            missingPct
            checkedAt
            repairAttempts
            nextRepairAt
            title
            subtitle
            posterPath
            mediaType
        }
        usenetTitleHealthSummary {
            healthy
            unhealthy
            notIngested
            unknown
            total
        }
        usenetTraffic {
            totalBytesDownloaded
            totalArticlesDownloaded
            providers {
                host
                bytesDownloaded
                articlesDownloaded
            }
            daily {
                day
                host
                bytesDownloaded
                articlesDownloaded
            }
        }
    }
`;

const DEBRID_ACCOUNT_INFO_QUERY = `
    query {
        debridAccountInfo {
            store
            email
            username
            subscriptionStatus
            premiumUntil
            cooldownUntil
            totalDownloadedBytes
            points
        }
    }
`;

interface GqlStatsResult {
  stats: {
    totalMovies: number;
    totalShows: number;
    totalSeasons: number;
    totalEpisodes: number;
    totalItems: number;
    incompleteItems: number;
    completionRate: number;
    completed: number;
    scraped: number;
    indexed: number;
    failed: number;
    paused: number;
    ongoing: number;
    partiallyCompleted: number;
    unreleased: number;
  };
  activity: Record<string, number>;
  yearReleases: { year: number; count: number }[];
}

interface GqlDebridAccountInfo {
  store: string;
  email: string | null;
  username: string | null;
  subscriptionStatus: string | null;
  premiumUntil: string | null;
  cooldownUntil: string | null;
  totalDownloadedBytes: number | null;
  points: number | null;
}

function mapDebridService(info: GqlDebridAccountInfo): DownloaderService {
  const now = getTimestamp();
  const expiresMs = info.premiumUntil
    ? DateTime.fromISO(info.premiumUntil).toMillis()
    : null;
  const daysLeft =
    expiresMs !== null && !isNaN(expiresMs)
      ? Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24))
      : null;

  return {
    service: info.store,
    email: info.email ?? null,
    username: info.username ?? null,
    premium_status: info.subscriptionStatus ?? "expired",
    premium_expires_at: info.premiumUntil ?? null,
    premium_days_left: daysLeft,
    points: info.points ?? null,
    total_downloaded_bytes: info.totalDownloadedBytes ?? null,
    cooldown_until: info.cooldownUntil ?? null,
  };
}

export const load = (({ depends, fetch, locals }) => {
  depends(DASHBOARD_STATS_DEPENDENCY);

  // All three queries start in parallel. Returning Promises (not awaited values)
  // makes SvelteKit stream the data — navigation is instant and content fills in.
  const statistics = gql<GqlStatsResult>(
    locals.backendUrl,
    locals.apiKey,
    STATS_QUERY,
    {},
    fetch,
  )
    .then((data) => {
      const s = data.stats;
      return {
        total_movies: s.totalMovies,
        total_shows: s.totalShows,
        total_seasons: s.totalSeasons,
        total_episodes: s.totalEpisodes,
        total_items: s.totalItems,
        incomplete_items: s.incompleteItems,
        completion_rate: s.completionRate,
        states: {
          Completed: s.completed,
          Scraped: s.scraped,
          Indexed: s.indexed,
          Failed: s.failed,
          Paused: s.paused,
          Ongoing: s.ongoing,
          PartiallyCompleted: s.partiallyCompleted,
          Unreleased: s.unreleased,
        },
        activity: data.activity,
        media_year_releases: data.yearReleases,
      };
    })
    .catch((err: unknown) => {
      logger.error("Failed to fetch stats:", err);
      return null;
    });

  const activePlaybackSessions = gql<{
    activePlaybackSessions: ActivePlaybackSession[];
  }>(locals.backendUrl, locals.apiKey, ACTIVE_PLAYBACK_QUERY, {}, fetch)
    .then((data) => data.activePlaybackSessions)
    .catch((): ActivePlaybackSession[] => []);

  const downloaderServices = gql<{ debridAccountInfo: GqlDebridAccountInfo[] }>(
    locals.backendUrl,
    locals.apiKey,
    DEBRID_ACCOUNT_INFO_QUERY,
    {},
    fetch,
  )
    .then((data) => data.debridAccountInfo.map(mapDebridService))
    .catch((): DownloaderService[] => []);

  const EMPTY_TITLE_SUMMARY: UsenetTitleHealthSummary = {
    healthy: 0,
    unhealthy: 0,
    notIngested: 0,
    unknown: 0,
    total: 0,
  };
  const usenetHealth = gql<{
    nntpProviders: NntpProviderHealth[];
    usenetStreamingHealth: UsenetStreamingHealth;
    usenetTitleHealth: UsenetTitleHealth[];
    usenetTitleHealthSummary: UsenetTitleHealthSummary;
    usenetTraffic: UsenetTraffic;
  }>(locals.backendUrl, locals.apiKey, USENET_HEALTH_QUERY, {}, fetch)
    .then((data) => ({
      providers: data.nntpProviders,
      streaming: data.usenetStreamingHealth,
      titles: data.usenetTitleHealth,
      titleSummary: data.usenetTitleHealthSummary,
      traffic: data.usenetTraffic,
    }))
    .catch(
      (): {
        providers: NntpProviderHealth[];
        streaming: UsenetStreamingHealth | null;
        titles: UsenetTitleHealth[];
        titleSummary: UsenetTitleHealthSummary;
        traffic: UsenetTraffic | null;
      } => ({
        providers: [],
        streaming: null,
        titles: [],
        titleSummary: EMPTY_TITLE_SUMMARY,
        traffic: null,
      }),
    );

  return {
    statistics,
    activePlaybackSessions,
    downloaderServices,
    usenetHealth,
  };
}) satisfies PageServerLoad;
