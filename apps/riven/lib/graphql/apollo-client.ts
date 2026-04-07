import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

import type { URL } from "node:url";

export let client: ApolloClient;

export function initApolloClient(uri: URL) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (client) {
    throw new Error("Apollo Client has already been initialized.");
  }

  return (client = new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
      },
    }),
    link: new HttpLink({
      uri: uri.toString(),
    }),
  }));
}
