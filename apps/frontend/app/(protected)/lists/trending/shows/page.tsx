import { TrendingDiscoveryPage } from "#app/(protected)/lists/trending/_components/trending-discovery-page/trending-discovery-page.tsx";
import { getClient } from "#lib/graphql/client.ts";

import { GET_FILTERED_TVDB_TRENDING_SHOWS } from "./_queries/get-tvdb-trending-shows.query";

async function fetchTrendingShowsPage(page: number) {
  "use server";

  const { data } = await getClient().query({
    query: GET_FILTERED_TVDB_TRENDING_SHOWS,
    variables: { page },
  });

  return new Map(
    (data?.tvdbTrendingShows ?? []).map((item) => [item.id, item]),
  );
}

export default async function TrendingShowsPage() {
  const initialData = await fetchTrendingShowsPage(1);

  return (
    <TrendingDiscoveryPage
      emptyMessage="No shows found"
      mediaType="show"
      title="Trending Shows"
      initialData={initialData}
      fetchPage={fetchTrendingShowsPage}
    />
  );
}
