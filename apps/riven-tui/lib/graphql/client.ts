import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export interface CreateGraphqlClientOptions {
  /** The GraphQL endpoint of the Riven instance to connect to. */
  uri: string;
  /** Sent as an `Authorization: Bearer` header when provided. */
  apiKey?: string | undefined;
}

export function createGraphqlClient({
  uri,
  apiKey,
}: CreateGraphqlClientOptions): ApolloClient {
  return new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
        ShowLikeMediaItem: ["Show", "Season", "Episode"],
      },
    }),
    link: new HttpLink({
      uri,
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    }),
  });
}
