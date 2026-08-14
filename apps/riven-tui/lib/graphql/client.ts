import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export interface CreateGraphqlClientOptions {
  /** The GraphQL endpoint of the Riven instance to connect to. */
  uri: string;
}

export function createGraphqlClient({
  uri,
}: CreateGraphqlClientOptions): ApolloClient {
  return new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
        ShowLikeMediaItem: ["Show", "Season", "Episode"],
      },
    }),
    link: new HttpLink({ uri }),
  });
}
