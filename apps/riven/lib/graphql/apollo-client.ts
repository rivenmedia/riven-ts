import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

import type { URL } from "node:url";

export let client: ApolloClient;

export function initApolloClient(uri: URL) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (client) {
    return client;
  }

  return (client = new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
      },
    }),
    dataMasking: true,
    assumeImmutableResults: true,
    link: new HttpLink({
      uri: uri.toString(),
    }),
  }));
}
