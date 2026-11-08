import { ApolloLink, HttpLink } from "@apollo/client";
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { SetContextLink } from "@apollo/client/link/context";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

import { cacheOptions } from "./cache-options.ts";

const apiKeyLink = new SetContextLink(
  ({ headers }: HttpLink.ContextOptions) => {
    if (!privateEnvironment.BACKEND_API_KEY) {
      throw new Error(
        "BACKEND_API_KEY is not set. Set it to the value of Riven's RIVEN_SETTING__apiKey.",
      );
    }

    return {
      headers: {
        ...headers,
        authorization: `Bearer ${privateEnvironment.BACKEND_API_KEY}`,
      },
    };
  },
);

export const { query } = registerApolloClient(
  () =>
    new ApolloClient({
      cache: new InMemoryCache(cacheOptions),
      link: ApolloLink.from([
        apiKeyLink,
        new HttpLink({
          uri: `${privateEnvironment.BACKEND_URL}/graphql`,
        }),
      ]),
    }),
);
