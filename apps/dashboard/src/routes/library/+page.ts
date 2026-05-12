import { client, gql } from "$lib/graphql";

import type { PageLoad } from "./$types.js";

const LIBRARY_ITEMS = gql`
  query LibraryItems(
    $limit: Int = 50
    $offset: Int = 0
    $search: String
    $type: String
  ) {
    mediaItems(limit: $limit, offset: $offset, search: $search, type: $type) {
      __typename
      id
      title
      year
      type
      state
      posterPath
      updatedAt
      createdAt
    }
  }
`;

export type LibraryItem = {
  __typename?: string;
  id: string;
  title: string;
  year?: number | null;
  type?: string | null;
  state?: string | null;
  posterPath?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

export type LibraryPageData = {
  items: LibraryItem[];
  search: string;
  page: number;
  pageSize: number;
  hasMore: boolean;
  error: string | null;
};

// SvelteKit only permits a fixed set of exports from `+page.ts`; underscore
// prefix is the convention for re-using a module-local symbol elsewhere.
export const _PAGE_SIZE = 50;

export const load: PageLoad = async ({ url }): Promise<LibraryPageData> => {
  const search = url.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const offset = (page - 1) * _PAGE_SIZE;

  try {
    const { data } = await client.query<{ mediaItems: LibraryItem[] }>({
      query: LIBRARY_ITEMS,
      variables: {
        limit: _PAGE_SIZE,
        offset,
        search: search.length > 0 ? search : null,
      },
      fetchPolicy: "network-only",
    });

    const items = data?.mediaItems ?? [];
    return {
      items,
      search,
      page,
      pageSize: _PAGE_SIZE,
      hasMore: items.length === _PAGE_SIZE,
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      search,
      page,
      pageSize: _PAGE_SIZE,
      hasMore: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};
