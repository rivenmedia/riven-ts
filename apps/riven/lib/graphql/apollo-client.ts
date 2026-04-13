import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
  HttpLink,
  InMemoryCache,
  type StoreObject,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { OperationTypeNode } from "graphql";
import { createClient } from "graphql-ws";
import { URL } from "node:url";

import { logger } from "../utilities/logger/logger.ts";

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

  const errorLink = new ErrorLink(({ error }) => {
    if (CombinedGraphQLErrors.is(error)) {
      error.errors.forEach((err) => {
        const { message, locations, path } = err;

        logger.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${JSON.stringify(path)}`,
          { err },
        );
      });
    } else if (CombinedProtocolErrors.is(error)) {
      error.errors.forEach((err) => {
        const { message, extensions } = err;

        logger.error(
          `[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(
            extensions,
          )}`,
          { err },
        );
      });
    } else {
      logger.error(`[Network error]: ${error.message}`, { err: error });
    }
  });

  const wsUrl = new URL(uri.toString());

  wsUrl.protocol = "ws";

  const wsLink = new GraphQLWsLink(
    createClient({
      url: wsUrl.toString(),
    }),
  );

  const httpLink = new HttpLink({
    uri: uri.toString(),
  });

  const splitLink = ApolloLink.split(
    ({ operationType }) => operationType === OperationTypeNode.SUBSCRIPTION,
    wsLink,
    httpLink,
  );

  const link = ApolloLink.from([errorLink, splitLink]);

  return (client = new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
      },
    }),
    dataMasking: true,
    assumeImmutableResults: true,
    link,
  }));
}
