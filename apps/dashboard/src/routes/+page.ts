import { client, gql } from "$lib/graphql";

import type { PageLoad } from "./$types.js";

const LIBRARY_COUNTS = gql`
  query LibraryCounts {
    libraryCounts {
      movies
      shows
      seasons
      episodes
      total
    }
  }
`;

const RECENT_MEDIA_ITEMS = gql`
  query RecentMediaItems($limit: Int = 10) {
    mediaItems(limit: $limit) {
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

export type LibraryCounts = {
  movies: number;
  shows: number;
  seasons: number;
  episodes: number;
  total: number;
};

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
  counts: LibraryCounts | null;
  recent: OverviewRecentItem[];
  error: string | null;
};

export const load: PageLoad = async (): Promise<OverviewData> => {
  try {
    const [countsResult, recentResult] = await Promise.allSettled([
      client.query<{ libraryCounts: LibraryCounts }>({
        query: LIBRARY_COUNTS,
        fetchPolicy: "network-only",
      }),
      client.query<{ mediaItems: OverviewRecentItem[] }>({
        query: RECENT_MEDIA_ITEMS,
        variables: { limit: 10 },
        fetchPolicy: "network-only",
      }),
    ]);

    const counts: OverviewData["counts"] =
      countsResult.status === "fulfilled" && countsResult.value.data
        ? countsResult.value.data.libraryCounts
        : null;

    const recent =
      recentResult.status === "fulfilled"
        ? (recentResult.value.data?.mediaItems ?? [])
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
      counts: null,
      recent: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
};
