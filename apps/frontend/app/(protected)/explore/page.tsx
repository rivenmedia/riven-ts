import { getClient } from "#lib/graphql/client.ts";

import { InfiniteItemGrid } from "../_components/infinite-item-grid/infinite-item-grid";
import { GET_SEARCH_RESULTS } from "./_queries/get-search-results.query";

async function fetchSearchResults(searchQuery: string, page: number) {
  const { data } = await getClient().query({
    query: GET_SEARCH_RESULTS,
    variables: {
      query: searchQuery,
      page,
    },
  });

  if (!data) {
    throw new Error("Failed to load search results");
  }

  // Item IDs are only unique within a plugin and media type
  const items = new Map(
    data.search.results.map(({ plugin, item }) => [
      `${plugin}:${item.type}:${item.id}`,
      item,
    ]),
  );

  return { items, errors: data.search.errors };
}

async function fetchSearchResultsPage(searchQuery: string, page: number) {
  "use server";

  const { items } = await fetchSearchResults(searchQuery, page);

  return items;
}

/**
 * Explore route showing paged search results for the `query` search param,
 * noting any sources that failed to search.
 */
export default async function ExplorePage({
  searchParams,
}: PageProps<"/explore">) {
  const { query: searchQuery } = await searchParams;

  if (!searchQuery) {
    return (
      <p className="text-muted-foreground col-span-full">
        Enter a search term to find movies and shows.
      </p>
    );
  }

  if (typeof searchQuery !== "string") {
    throw new TypeError("Invalid search query");
  }

  const { items, errors } = await fetchSearchResults(searchQuery, 1);

  return (
    <>
      {errors.length > 0 && (
        <p className="text-muted-foreground col-span-full text-sm">
          Some sources could not be searched:{" "}
          {errors
            .map(({ plugin, message }) => `${plugin} (${message})`)
            .join(", ")}
        </p>
      )}
      <InfiniteItemGrid
        key={searchQuery}
        fetchPage={fetchSearchResultsPage.bind(null, searchQuery)}
        initialData={items}
        noItemsFoundMessage={`No items found matching "${searchQuery}"`}
      />
    </>
  );
}
