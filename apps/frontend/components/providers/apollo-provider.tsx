"use client";

import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { OperationTypeNode } from "graphql";
import { createClient } from "graphql-ws";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

function makeLink() {
  // Subscriptions are only established in the browser, so there's no need for a WebSocket during SSR.
  // This avoids `typeof window`, which Storybook's test runner compiles as if it were on the server
  if (!("window" in globalThis)) {
    return new HttpLink({ uri: `${privateEnvironment.BACKEND_URL}/graphql` });
  }

  const graphqlUrl = new URL("/graphql", globalThis.location.href);
  const wsUrl = new URL(graphqlUrl);

  wsUrl.protocol = wsUrl.protocol.replace(/^http/u, "ws");

  const httpLink = new HttpLink({ uri: graphqlUrl.toString() });
  const wsLink = new GraphQLWsLink(createClient({ url: wsUrl.toString() }));

  return ApolloLink.split(
    ({ operationType }) => operationType === OperationTypeNode.SUBSCRIPTION,
    wsLink,
    httpLink,
  );
}

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
        ShowLikeMediaItem: ["Show", "Season", "Episode"],
      },
      typePolicies: {
        TmdbIndexerData: {
          keyFields: ["type", "id"],
        },
      },
    }),
    link: makeLink(),
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
