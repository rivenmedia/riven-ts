import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { OperationTypeNode } from "graphql";
import { createClient } from "graphql-ws";
import { URL } from "node:url";

export let client: ApolloClient;

export function initApolloClient(uri: URL) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (client) {
    return;
  }

  const httpLink = new HttpLink({
    uri: uri.toString(),
  });

  const wsUrl = new URL(uri.toString());

  wsUrl.protocol = "ws";

  const wsLink = new GraphQLWsLink(
    createClient({
      url: wsUrl.toString(),
    }),
  );

  const splitLink = ApolloLink.split(
    ({ operationType }) => operationType === OperationTypeNode.SUBSCRIPTION,
    wsLink,
    httpLink,
  );

  client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });
}
