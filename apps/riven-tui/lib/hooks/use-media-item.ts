import { useCallback, useEffect, useState } from "react";

import { GET_MEDIA_ITEM } from "../queries/get-media-item.query.ts";
import { toError } from "./query-state.ts";

import type { GraphqlClient } from "../graphql/graphql-client.ts";
import type { GetMediaItemQuery } from "../queries/get-media-item.query.typegen.ts";
import type { QueryState } from "./query-state.ts";

export type MediaItemDetail = GetMediaItemQuery["mediaItemById"];

export function useMediaItem(
  client: GraphqlClient,
  id: string,
): { refetch: () => void; state: QueryState<MediaItemDetail> } {
  const [state, setState] = useState<QueryState<MediaItemDetail>>({
    status: "loading",
  });

  const refetch = useCallback(() => {
    setState({ status: "loading" });

    client
      .query({
        query: GET_MEDIA_ITEM,
        variables: { id },
        fetchPolicy: "network-only",
      })
      .then(({ data }) => {
        if (!data) {
          throw new Error("The server returned no data.");
        }

        setState({ status: "success", data: data.mediaItemById });
      })
      .catch((error: unknown) => {
        setState({ status: "error", error: toError(error) });
      });
  }, [client, id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { state, refetch };
}
