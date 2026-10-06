import { HttpLink } from "@apollo/client";
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

export const { getClient, query, PreloadQuery } = registerApolloClient(
  () =>
    new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        // this needs to be an absolute url, as relative urls cannot be used in SSR
        uri: `${privateEnvironment.BACKEND_URL}/graphql`,
        fetchOptions: {
          // you can pass additional options that should be passed to `fetch` here,
          // e.g. Next.js-related `fetch` options regarding caching and revalidation
          // see https://nextjs.org/docs/app/api-reference/functions/fetch#fetchurl-options
        },
      }),
    }),
);
