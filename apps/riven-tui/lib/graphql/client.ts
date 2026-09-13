import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export interface CreateGraphqlClientOptions {
  /** The GraphQL endpoint of the Riven instance to connect to. */
  uri: string;
}

export function createGraphqlClient({
  uri,
}: CreateGraphqlClientOptions): ApolloClient {
  return new ApolloClient({
    defaultOptions: {
      mutate: {
        errorPolicy: "all",
        fetchPolicy: "network-only",
      },
      query: {
        errorPolicy: "all",
        fetchPolicy: "network-only",
      },
    },
    cache: new InMemoryCache({
      resultCaching: false,
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
        ShowLikeMediaItem: ["Show", "Season", "Episode"],
      },
    }),
    link: new HttpLink({ uri }),
  });
}
