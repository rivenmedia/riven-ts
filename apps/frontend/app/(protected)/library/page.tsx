import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { query } from "#lib/graphql/client.ts";

import { GET_LIBRARY_ITEMS } from "./_queries/get-library-items.query.ts";
import { LibraryPage } from "./page.client.tsx";

async function getLibraryItems() {
  "use server";

  const { data } = await query({
    query: GET_LIBRARY_ITEMS,
    variables: {
      type: ["movie", "show"],
      state: MediaItemState.options,
    },
  });

  if (!data?.mediaItems) {
    throw new Error("Failed to fetch library items");
  }

  return data.mediaItems;
}

export default async function Library() {
  const data = await getLibraryItems();

  return (
    <LibraryPage
      items={data.items}
      totalItems={data.totalCount}
      endCursor={data.endCursor}
      hasNextPage={data.hasNextPage}
    />
  );
}
