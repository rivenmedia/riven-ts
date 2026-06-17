import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startStandaloneServer } from "@apollo/server/standalone";
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

export interface StartGQLServerInput {
  mainRunnerRef: ActorRefFromLogic<typeof mainRunnerMachine>;
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
    ],
    formatError(formattedError, error) {
      logger.error("GraphQL Error:", { err: error });

      return formattedError;
    },
  });

  const sendEvent: GraphQLContext["sendEvent"] = (event) => {
    if (!event.type.startsWith("riven-external.")) {
      throw new Error(
        "Only `riven-external.` events can be sent from the GraphQL server",
      );
    }

    mainRunnerRef.send(event);
  };

  const { gqlHost, gqlPort } = settings.instanceSettings;

  const { url } = await startStandaloneServer(server, {
    listen: {
      host: gqlHost,
      port: gqlPort,
    },
    context: buildContextFunction(sendEvent, validPlugins),
  });

  initApolloClient(new URL(url));

  return {
    server,
    url,
  };
});
