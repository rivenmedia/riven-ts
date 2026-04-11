import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  type StoreObject,
} from "@apollo/client";

import type { URL } from "node:url";

declare module "@apollo/client" {
  interface ApolloCache {
    // Override the identify helper for increased type-safety.
    // If the object has __typename and id fields, it will always return a string.
    identify<T extends StoreObject>({
      __typename,
      id,
    }: T): T extends { __typename: string; id: string }
      ? `${T["__typename"]}:${T["id"]}`
      : undefined;
  }

  interface InMemoryCache {
    // Identify override must also be set here to target the correct interface.
    identify<T extends StoreObject>({
      __typename,
      id,
    }: T): T extends { __typename: string; id: string }
      ? `${T["__typename"]}:${T["id"]}`
      : undefined;
  }
}

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
