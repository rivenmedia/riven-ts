import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@as-integrations/express5";
import { NestFactory } from "@nestjs/core";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { URL } from "node:url";
import { fromPromise } from "xstate";

import { AppModule } from "../../../app.module.ts";
import { initApolloClient } from "../../../graphql/apollo-client.ts";
import { buildContextFunction } from "../../../graphql/build-context-function.ts";
import { createNestContainer } from "../../../graphql/nest-container.ts";
import { resolvers } from "../../../graphql/resolvers/index.ts";
import { PluginRegistryService } from "../../../plugins/plugins.module.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { redisCache } from "../../../utilities/redis-cache.ts";
import { settings } from "../../../utilities/settings.ts";

import type { ApolloServerContext } from "../../../graphql/context.ts";
import type { ValidPluginMap } from "../../../types/plugins.ts";
import type {
  mainRunnerMachine,
  MainRunnerMachineIntake,
} from "../../main-runner/index.js";
import type { INestApplicationContext } from "@nestjs/common";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";
import type { ActorRefFromLogic } from "xstate";

export interface StartGQLServerInput {
  mainRunnerRef: ActorRefFromLogic<typeof mainRunnerMachine>;
  pluginSettings: PluginSettings;
  validPlugins: ValidPluginMap;
}

export interface StartGQLServerOutput {
  applicationContext: INestApplicationContext;
  server: ApolloServer<ApolloServerContext>;
  url: string;
}

export const startGqlServer = fromPromise<
  StartGQLServerOutput,
  StartGQLServerInput
>(async ({ input: { mainRunnerRef, pluginSettings, validPlugins } }) => {
  // Created here rather than at process start so that the database connection
  // the container adopts is the one the bootstrap machine has already
  // established, preserving the existing startup ordering. Ownership moves to
  // Nest once it drives bootstrap itself.
  const applicationContext = await NestFactory.createApplicationContext(
    AppModule,
    { logger: false },
  );

  // Plugins are discovered at runtime, so the registrar's result is handed to
  // the container here rather than declared in the module graph.
  const pluginRegistry = applicationContext.get(PluginRegistryService);

  pluginRegistry.register({ plugins: validPlugins, pluginSettings });

  const pluginResolvers = pluginRegistry.resolvers;

  const app = express();
  const httpServer = createServer((...args) => {
    app(...args);
  });

  const server = new ApolloServer<ApolloServerContext>({
    cache: redisCache,
    schema: await buildSchema({
      resolvers: [...resolvers, ...pluginResolvers],
      container: createNestContainer(applicationContext),
    }),
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
    ],
    formatError(formattedError, error) {
      logger.error("GraphQL Error:", { err: error });

      return formattedError;
    },
  });

  await server.start();

  const sendExternalEvent: GraphQLContext["sendEvent"] = (event) => {
    if (!event.type.startsWith("riven-external.")) {
      throw new Error(
        "Only `riven-external.` events can be sent from the GraphQL server",
      );
    }

    mainRunnerRef.send(event);
  };

  const sendEvent: MainRunnerMachineIntake = (event) => {
    mainRunnerRef.send(event);
  };

  app.use(
    "/",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: buildContextFunction(sendEvent, sendExternalEvent),
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
    applicationContext,
    server,
    url: url.toString(),
  };
});
