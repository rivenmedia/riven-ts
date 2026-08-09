import { useCallback, useEffect, useState } from "react";

import { GET_LIBRARY_ITEMS } from "../queries/get-library-items.query.ts";
import { toError } from "./query-state.ts";

import type { GraphqlClient } from "../graphql/graphql-client.ts";
import type { GetLibraryItemsQuery } from "../queries/get-library-items.query.typegen.ts";
import type { QueryState } from "./query-state.ts";

export type LibraryItem = Extract<
  GetLibraryItemsQuery["mediaItems"][number],
  { __typename: "Movie" | "Show" }
>;

/**
 * `mediaItems` returns every media item in the database (movies, shows,
 * seasons, and episodes alike) - the library view only cares about the
 * top-level items, so seasons and episodes are filtered out here.
 */
export function toLibraryItems(
  mediaItems: GetLibraryItemsQuery["mediaItems"],
): LibraryItem[] {
  return mediaItems
    .filter(
      (item): item is LibraryItem =>
        item.__typename === "Movie" || item.__typename === "Show",
    )
    .toSorted((a, b) => a.fullTitle.localeCompare(b.fullTitle));
}

export function useLibraryItems(client: GraphqlClient): {
  refetch: () => void;
  state: QueryState<LibraryItem[]>;
} {
  const [state, setState] = useState<QueryState<LibraryItem[]>>({
    status: "loading",
  });

  const refetch = useCallback(() => {
    setState({ status: "loading" });

    client
      .query({ query: GET_LIBRARY_ITEMS, fetchPolicy: "network-only" })
      .then(({ data }) => {
        if (!data) {
          throw new Error("The server returned no data.");
        }

        setState({ status: "success", data: toLibraryItems(data.mediaItems) });
      })
      .catch((error: unknown) => {
        setState({ status: "error", error: toError(error) });
      });
  }, [client]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { state, refetch };
}
