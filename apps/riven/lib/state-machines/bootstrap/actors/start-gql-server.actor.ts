import {
  type ApolloServerContext,
  buildSchema,
} from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";
import responseCachePlugin from "@apollo/server-plugin-response-cache";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import { useServer } from "graphql-ws/use/ws";
import http from "node:http";
import { URL } from "node:url";
import { WebSocketServer } from "ws";
import { fromPromise } from "xstate";

import { buildContext } from "../../../graphql/build-context.ts";
import { DownloadingResolver } from "../../../graphql/downloading/resolvers/downloading.resolver.ts";
import { MovieResolver } from "../../../graphql/movies/resolvers/movie.resolver.ts";
import { pubSub } from "../../../graphql/pub-sub.ts";
import { ScrapingResolver } from "../../../graphql/scraping/scraping.resolver.ts";
import { ShowResolver } from "../../../graphql/shows/resolvers/show.resolver.ts";
import { initApolloClient } from "../../../utilities/apollo-client.ts";
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
  url: URL;
}

export const startGqlServer = fromPromise<
  StartGQLServerOutput,
  StartGQLServerInput
>(async ({ input: { validPlugins, pluginSettings } }) => {
  const pluginResolvers = [...validPlugins.values()].flatMap(
    (p) => p.config.resolvers,
  );

  const schema = await buildSchema(
    [
      MovieResolver,
      ShowResolver,
      ScrapingResolver,
      DownloadingResolver,
      ...pluginResolvers,
    ],
    pubSub,
  );

  const gqlPath = "/graphql";

  const app = express();
  const httpServer = http.createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: gqlPath,
  });

  const serverCleanup = useServer({ schema }, wsServer);

  const apolloServer = new ApolloServer<ApolloServerContext>({
    cache: redisCache,
    schema,
    introspection: true,
    logger,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        serverWillStart() {
          return Promise.resolve({
            async drainServer() {
              await serverCleanup.dispose();
            },
          });
        },
      },
      ApolloServerPluginCacheControl({
        // Cache everything for 60 seconds by default.
        defaultMaxAge: 60,
      }),
      responseCachePlugin(),
    ],
    formatError(formattedError, error) {
      logger.error("GraphQL Error:", { err: error });

      return formattedError;
    },
  });

  await apolloServer.start();

  const contextFn = buildContext(
    apolloServer,
    pluginSettings,
    [...validPlugins.entries()].map(([_, plugin]) => plugin.config),
  );

  app.use(
    gqlPath,
    cors(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: contextFn,
    }),
  );

  await new Promise<void>((resolve) => {
    httpServer.listen(settings.gqlPort, resolve);
  });

  const url = new URL(
    gqlPath,
    `http://localhost:${settings.gqlPort.toString()}`,
  );

  initApolloClient(url);

  return {
    server: apolloServer,
    url,
  };
});
