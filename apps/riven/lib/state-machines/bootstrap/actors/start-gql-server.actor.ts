import {
  type ApolloServerContext,
  buildSchema,
} from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import { useServer } from "graphql-ws/use/ws";
import http from "node:http";
import { URL } from "node:url";
import { WebSocketServer } from "ws";
import { fromPromise } from "xstate";

import { initApolloClient } from "../../../graphql/apollo-client.ts";
import { buildContextFunction } from "../../../graphql/build-context-function.ts";
import { pubSub } from "../../../graphql/pub-sub.ts";
import { resolvers } from "../../../graphql/resolvers/index.ts";
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
>(async ({ input: { validPlugins } }) => {
  const pluginResolvers = [...validPlugins.values()].flatMap(
    (p) => p.config.resolvers,
  );

  const gqlPath = "/";

  const app = express();
  const httpServer = http.createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: gqlPath,
  });

  const schema = await buildSchema({
    resolvers: [...resolvers, ...pluginResolvers],
    pubSub,
  });

  const serverCleanup = useServer(
    {
      schema,
      context: buildContextFunction(),
    },
    wsServer,
  );

  const server = new ApolloServer<ApolloServerContext>({
    cache: redisCache,
    schema,
    introspection: true,
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

  await server.start();

  app.use(
    gqlPath,
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: buildContextFunction(),
    }),
  );

  await new Promise<void>((resolve) => {
    httpServer.listen({ port: settings.gqlPort }, resolve);
  });

  const url = new URL(
    gqlPath,
    `http://localhost:${settings.gqlPort.toString()}`,
  );

  initApolloClient(url);

  return {
    server,
    url,
  };
});
