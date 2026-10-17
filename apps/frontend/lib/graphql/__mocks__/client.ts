import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

const createClient = () =>
  new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
        ShowLikeMediaItem: ["Show", "Season", "Episode"],
      },
    }),
    link: new HttpLink({
      uri: new URL("/graphql", privateEnvironment.BACKEND_URL).toString(),
    }),
  });

let client = createClient();

/**
 * The real client uses `registerApolloClient` which isn't available in RSC contexts,
 * so this mock emulates its behaviour to enable stories which use server components.
 */
export const query: ApolloClient["query"] = async (options) =>
  client.query(options);

export const getClient = () => client;

/**
 * `registerApolloClient` creates a client per request, so this emulates that by creating one per story.
 *
 * Without this, cached results (and in-flight requests, which Apollo deduplicates) leak between stories.
 */
export const resetClient = () => {
  client.stop();
  client = createClient();
};
