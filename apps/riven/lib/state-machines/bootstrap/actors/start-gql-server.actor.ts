import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@as-integrations/express5";
import { RequestContext } from "@mikro-orm/core";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { useServer } from "graphql-ws/use/ws";
import { createServer } from "node:http";
import { URL } from "node:url";
import { WebSocketServer } from "ws";
import { fromPromise } from "xstate";

import { initAuth } from "#auth/auth.ts";
import { initApolloClient } from "#graphql/apollo-client.ts";
import { buildContextFunction } from "#graphql/build-context-function.ts";
import { pubSub } from "#graphql/pubsub.ts";
import { resolvers } from "#graphql/resolvers/index.ts";
import { logger } from "#utilities/logger/logger.ts";
import { redisCache } from "#utilities/redis-cache.ts";
import { settings } from "#utilities/settings.ts";

import type { ApolloServerContext } from "#graphql/context.ts";
import type {
  mainRunnerMachine,
  MainRunnerMachineIntake,
} from "#state-machines/main-runner/index.ts";
import type { ValidPluginMap } from "#types/plugins.ts";
import type { MikroORM } from "@mikro-orm/core";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";
import type { RequestHandler } from "express";
import type { ActorRefFromLogic } from "xstate";

export interface StartGQLServerInput {
  orm: MikroORM;
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
>(async ({ input: { orm, mainRunnerRef, validPlugins } }) => {
  const pluginResolvers = validPlugins
    .values()
    .flatMap(({ config }) => config.resolvers)
    .toArray();

  const app = express();

  app.disable("x-powered-by");

  const httpServer = createServer((...args) => {
    app(...args);
  });

  const graphqlPath = "/graphql";

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: graphqlPath,
  });

  const schema = await buildSchema({
    resolvers: [...resolvers, ...pluginResolvers],
    pubSub,
  });

  const sendEvent: MainRunnerMachineIntake = (event) => {
    mainRunnerRef.send(event);
  };

  const sendExternalEvent: GraphQLContext["sendEvent"] = (event) => {
    if (!event.type.startsWith("riven-external.")) {
      throw new Error(
        "Only `riven-external.` events can be sent from the GraphQL server",
      );
    }

    mainRunnerRef.send(event);
  };

  const context = buildContextFunction(
    sendEvent,
    sendExternalEvent,
    validPlugins,
  );

  const serverCleanup = useServer(
    {
      schema,
      context,
    },
    wsServer,
  );

  const server = new ApolloServer<ApolloServerContext>({
    cache: redisCache,
    schema,
    introspection: true,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault(),
      {
        async requestDidStart({ request: { operationName } }) {
          if (operationName) {
            logger.silly(`Received ${operationName}`, {
              "riven.gql.operation-name": operationName,
            });
          }

          return Promise.resolve();
        },
      },
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
      ApolloServerPluginCacheControl(),
    ],
    formatError(formattedError, error) {
      logger.error("GraphQL Error:", { err: error });

      return formattedError;
    },
  });

  await server.start();

  const auth = initAuth(orm);
  const withRequestContext: RequestHandler = (_req, _res, next) => {
    RequestContext.create(orm.em, next);
  };

  app.all("/api/auth/*splat", withRequestContext, toNodeHandler(auth));

  app.use(
    graphqlPath,
    cors(),
    express.json(),
    withRequestContext,
    expressMiddleware(server, { context }),
  );

  const url = new URL(
    `http://${settings.host}:${settings.port.toString()}/${graphqlPath}`,
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
