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
      cache: new InMemoryCache({
        possibleTypes: {
          MediaItem: ["Movie", "Show", "Season", "Episode"],
          ShowLikeMediaItem: ["Show", "Season", "Episode"],
        },
      }),
      link: new HttpLink({
        uri: `${privateEnvironment.BACKEND_URL}/graphql`,
      }),
    }),
);
