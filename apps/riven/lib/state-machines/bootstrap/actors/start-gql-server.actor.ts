import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { URL } from "node:url";
import { type ActorRefFromLogic, fromPromise } from "xstate";

import { initApolloClient } from "../../../graphql/apollo-client.ts";
import { buildContextFunction } from "../../../graphql/build-context-function.ts";
import { resolvers } from "../../../graphql/resolvers/index.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { redisCache } from "../../../utilities/redis-cache.ts";
import { settings } from "../../../utilities/settings.ts";
import { mainRunnerMachine } from "../../main-runner/index.js";

import type { ApolloServerContext } from "../../../graphql/context.ts";
import type { ValidPluginMap } from "../../../types/plugins.ts";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

export interface StartGQLServerInput {
  mainRunnerRef: ActorRefFromLogic<typeof mainRunnerMachine>;
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
>(async ({ input: { mainRunnerRef, validPlugins } }) => {
  const pluginResolvers = validPlugins
    .values()
    .flatMap((p) => p.config.resolvers)
    .toArray();

  const app = express();
  const httpServer = createServer(app);

  const server = new ApolloServer<ApolloServerContext>({
    cache: redisCache,
    schema: await buildSchema({
      resolvers: [...resolvers, ...pluginResolvers],
    }),
    introspection: true,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault(),
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
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
    formatError(formattedError, error) {
      logger.error("GraphQL Error:", { err: error });

      return formattedError;
    },
  });

  await server.start();

  const sendEvent: GraphQLContext["sendEvent"] = (event) => {
    if (!event.type.startsWith("riven-external.")) {
      throw new Error(
        "Only `riven-external.` events can be sent from the GraphQL server",
      );
    }

    mainRunnerRef.send(event);
  };

  app.use(
    "/",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: buildContextFunction(sendEvent),
    }),
  );

  const url = new URL(
    `http://${settings.gqlHost}:${settings.gqlPort.toString()}/`,
  );

  await new Promise<void>((resolve) => {
    httpServer.listen(
      {
        host: url.hostname,
        port: url.port,
      },
      resolve,
    );
  });

  initApolloClient(url);

  return {
    server,
    url: url.toString(),
  };
});
