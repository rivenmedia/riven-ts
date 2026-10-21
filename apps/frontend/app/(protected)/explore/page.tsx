import { cacheLife } from "next/cache";

import { query } from "#lib/graphql/client.ts";

import { InfiniteItemGrid } from "../_components/infinite-item-grid/infinite-item-grid";
import { GET_SEARCH_RESULTS } from "./_queries/get-search-results.query";

async function getSearchResults(searchQuery: string, page = 1) {
  "use cache";

  cacheLife("days");

  const { data } = await query({
    query: GET_SEARCH_RESULTS,
    variables: {
      query: searchQuery,
      page,
    },
  });

  const results = new Map();

  for (const result of data?.search.results ?? []) {
    results.set(result.item.id, result.item);
  }

  return results;
}

export default async function ExplorePage({
  searchParams,
}: PageProps<"/explore">) {
  const { query: searchQuery } = await searchParams;

  if (!searchQuery) {
    return null;
  }

  if (typeof searchQuery !== "string") {
    throw new TypeError("Invalid search query");
  }

  const initialData = await getSearchResults(searchQuery);

  return (
    <InfiniteItemGrid
      key={searchQuery}
      fetchPage={getSearchResults.bind(null, searchQuery)}
      initialData={initialData}
      noItemsFoundMessage={`No items found matching "${searchQuery}"`}
    />
  );
}
