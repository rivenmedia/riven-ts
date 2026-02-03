import { buildContext } from "@repo/core-util-graphql-context";
import { buildSchema } from "@repo/core-util-graphql-schema";
import { logger } from "@repo/core-util-logger";

import { ApolloServer, type BaseContext } from "@apollo/server";
import responseCachePlugin from "@apollo/server-plugin-response-cache";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { startStandaloneServer } from "@apollo/server/standalone";
import { fromPromise } from "xstate";
import z from "zod";

import { redisCache } from "../../../utilities/redis-cache.ts";

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
  const PORT = z.coerce.number().int().default(3000).parse(process.env["PORT"]);

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
      port: PORT,
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
