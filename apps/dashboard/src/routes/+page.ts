import { client, gql } from "$lib/graphql";

import type { PageLoad } from "./$types.js";

const LIBRARY_COUNTS = gql`
  query LibraryCounts {
    movieCount
    showCount
    episodeCount
  }
`;

const RECENT_MEDIA_ITEMS = gql`
  query RecentMediaItems($limit: Int = 10) {
    recentMediaItems(limit: $limit) {
      __typename
      id
      title
      year
      type
      state
      posterPath
      createdAt
    }
  }
`;

export type OverviewRecentItem = {
  __typename?: string;
  id: string;
  title: string;
  year?: number | null;
  type?: string | null;
  state?: string | null;
  posterPath?: string | null;
  createdAt?: string | null;
};

export type OverviewData = {
  counts: {
    movieCount: number | null;
    showCount: number | null;
    episodeCount: number | null;
  };
  recent: OverviewRecentItem[];
  error: string | null;
};

export const load: PageLoad = async (): Promise<OverviewData> => {
  try {
    const [countsResult, recentResult] = await Promise.allSettled([
      client.query<{
        movieCount: number;
        showCount: number;
        episodeCount: number;
      }>({
        query: LIBRARY_COUNTS,
        fetchPolicy: "network-only",
      }),
      client.query<{ recentMediaItems: OverviewRecentItem[] }>({
        query: RECENT_MEDIA_ITEMS,
        variables: { limit: 10 },
        fetchPolicy: "network-only",
      }),
    ]);

    const counts: OverviewData["counts"] =
      countsResult.status === "fulfilled" && countsResult.value.data
        ? countsResult.value.data
        : { movieCount: null, showCount: null, episodeCount: null };

    const recent =
      recentResult.status === "fulfilled"
        ? (recentResult.value.data?.recentMediaItems ?? [])
        : [];

    const failures = [countsResult, recentResult].filter(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult[];

    return {
      counts,
      recent,
      error:
        failures.length > 0
          ? failures
              .map((f) => String(f.reason?.message ?? f.reason))
              .join("; ")
          : null,
    };
  } catch (err) {
    return {
      counts: { movieCount: null, showCount: null, episodeCount: null },
      recent: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
};
