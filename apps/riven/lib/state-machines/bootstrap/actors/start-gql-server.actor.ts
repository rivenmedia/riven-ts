import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer, type BaseContext } from "@apollo/server";
import responseCachePlugin from "@apollo/server-plugin-response-cache";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { startStandaloneServer } from "@apollo/server/standalone";
import { fromPromise } from "xstate";

import { buildContext } from "../../../graphql/build-context.ts";
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
  server: ApolloServer;
  url: string;
}

export const startGqlServer = fromPromise<
  StartGQLServerOutput,
  StartGQLServerInput
>(async ({ input: { validPlugins, pluginSettings } }) => {
  const pluginResolvers = [...validPlugins.values()].flatMap(
    (p) => p.config.resolvers,
  );

  const server = new ApolloServer<BaseContext>({
    cache: redisCache,
    schema: await buildSchema(pluginResolvers),
    introspection: true,
    plugins: [
      ApolloServerPluginCacheControl({
        // Cache everything for 60 seconds by default.
        defaultMaxAge: 60,
      }),
      responseCachePlugin(),
    ],
    formatError(formattedError, error) {
      logger.error("GraphQL Error:", { error });

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

  return {
    server,
    url,
  };
});
