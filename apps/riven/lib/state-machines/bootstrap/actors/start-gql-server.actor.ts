import {
  type ApolloServerContext,
  buildSchema,
} from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";
import responseCachePlugin from "@apollo/server-plugin-response-cache";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { startStandaloneServer } from "@apollo/server/standalone";
import { URL } from "node:url";
import { fromPromise } from "xstate";

import { initApolloClient } from "../../../graphql/apollo-client.ts";
import { buildContext } from "../../../graphql/build-context.ts";
import { EpisodeResolver } from "../../../graphql/resolvers/episode.resolver.ts";
import { MediaItemResolver } from "../../../graphql/resolvers/media-item.resolver.ts";
import { MovieResolver } from "../../../graphql/resolvers/movie.resolver.ts";
import { SeasonResolver } from "../../../graphql/resolvers/season.resolver.ts";
import { ShowResolver } from "../../../graphql/resolvers/show.resolver.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { redisCache } from "../../../utilities/redis-cache.ts";
import { settings } from "../../../utilities/settings.ts";

import type { ValidPluginMap } from "../../../types/plugins.ts";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

export interface StartGQLServerInput {
  pluginSettings: PluginSettings;
  validPlugins: ValidPluginMap;
}

export interface StartGQLServerOutput {
  server: ApolloServer<ApolloServerContext>;
  url: string;
}

export const startGqlServer = fromPromise<
  StartGQLServerOutput,
  StartGQLServerInput
>(async ({ input: { validPlugins, pluginSettings } }) => {
  const pluginResolvers = [...validPlugins.values()].flatMap(
    (p) => p.config.resolvers,
  );

  const server = new ApolloServer<ApolloServerContext>({
    cache: redisCache,
    schema: await buildSchema([
      MediaItemResolver,
      MovieResolver,
      ShowResolver,
      EpisodeResolver,
      SeasonResolver,
      ...pluginResolvers,
    ]),
    introspection: true,
    plugins: [
      ApolloServerPluginCacheControl({
        // Cache everything for 60 seconds by default.
        defaultMaxAge: 60,
      }),
      responseCachePlugin(),
      {
        requestDidStart({ request: { operationName } }) {
          if (operationName) {
            logger.silly(`Received ${operationName}`, {
              "riven.gql.operation-name": operationName,
            });
          }

          return Promise.resolve();
        },
      },
    ],
    formatError(formattedError, error) {
      logger.error("GraphQL Error:", { err: error });

      return formattedError;
    },
  });

  const { url } = await startStandaloneServer(server, {
    listen: {
      port: settings.gqlPort,
    },
    context: buildContext(
      server,
      pluginSettings,
      [...validPlugins.entries()].map(([_, plugin]) => plugin.config),
    ),
  });

  initApolloClient(new URL(url));

  return {
    server,
    url,
  };
});
