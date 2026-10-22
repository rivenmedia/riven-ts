import { TrendingDiscoveryPage } from "#app/(protected)/lists/trending/_components/trending-discovery-page/trending-discovery-page.tsx";
import { getClient } from "#lib/graphql/client.ts";

import { GET_FILTERED_TMDB_TRENDING_MOVIES } from "./_queries/get-tmdb-trending-movies.query";

async function fetchTrendingMoviesPage(page: number) {
  "use server";

  const { data } = await getClient().query({
    query: GET_FILTERED_TMDB_TRENDING_MOVIES,
    variables: { page },
  });

  return new Map(
    (data?.tmdbTrendingMovies ?? []).map((item) => [item.id, item]),
  );
}

/** Infinite-scrolling list of trending movies. */
export default async function TrendingMoviesPage() {
  const trendingMoviesPage = await fetchTrendingMoviesPage(1);

  return (
    <TrendingDiscoveryPage
      emptyMessage="No movies found"
      mediaType="movie"
      title="Trending Movies"
      initialData={trendingMoviesPage}
      fetchPage={fetchTrendingMoviesPage}
    />
  );
}
