import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

const httpLink = new HttpLink({
  uri: new URL("/graphql", privateEnvironment.BACKEND_URL).toString(),
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: httpLink,
});

/**
 * The real client uses `registerApolloClient` which isn't available in RSC contexts,
 * so this mock emulates its behaviour to enable stories which use server components.
 */
export const query: ApolloClient["query"] = async (options) =>
  client.query(options);
