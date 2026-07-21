import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

import type { StoreObject } from "@apollo/client";
import type { URL } from "node:url";

declare module "@apollo/client" {
  interface ApolloCache {
    // Override the identify helper for increased type-safety.
    // If the object has __typename and id fields, it will always return a string.
    // oxlint-disable-next-line typescript/method-signature-style - Needs to be written as such to override the existing method signature.
    identify<T extends StoreObject>({
      __typename,
      id,
    }: T): T extends { __typename: string; id: string }
      ? `${T["__typename"]}:${T["id"]}`
      : undefined;
  }

  interface InMemoryCache {
    // Identify override must also be set here to target the correct interface.
    // oxlint-disable-next-line typescript/method-signature-style - Needs to be written as such to override the existing method signature.
    identify<T extends StoreObject>({
      __typename,
      id,
    }: T): T extends { __typename: string; id: string }
      ? `${T["__typename"]}:${T["id"]}`
      : undefined;
  }
}

// oxlint-disable-next-line init-declarations import/no-mutable-exports
export let client: ApolloClient;

export function initApolloClient(uri: URL, signal?: AbortSignal) {
  // oxlint-disable-next-line typescript/no-unnecessary-condition
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
      fetchOptions: {
        signal: signal ?? null,
      },
    }),
  }));
}
