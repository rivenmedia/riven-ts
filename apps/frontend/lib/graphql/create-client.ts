import { ApolloLink, HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { SetContextLink } from "@apollo/client/link/context";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

import { cacheOptions } from "./cache-options.ts";

/**
 * Creates a client for Riven's GraphQL API that authenticates each request
 * with a bearer token.
 *
 * @param readBearerToken Reads the token for a request, or `null` to send none
 */
export function createClient(
  readBearerToken: () => Promise<string | null> | string | null,
) {
  const bearerTokenLink = new SetContextLink(
    async ({ headers }: HttpLink.ContextOptions) => {
      const token = await readBearerToken();

      if (!token) {
        return {};
      }

      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token}`,
        },
      };
    },
  );

  return new ApolloClient({
    cache: new InMemoryCache(cacheOptions),
    link: ApolloLink.from([
      bearerTokenLink,
      new HttpLink({
        uri: `${privateEnvironment.BACKEND_URL}/graphql`,
      }),
    ]),
  });
}
