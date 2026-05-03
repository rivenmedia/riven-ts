import {
  type ApolloServerContext,
  buildSchema,
} from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { URL } from "node:url";
import { fromPromise } from "xstate";

import { initApolloClient } from "../../../graphql/apollo-client.ts";
import { buildContextFunction } from "../../../graphql/build-context-function.ts";
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
  url: string;
}

export const startGqlServer = fromPromise<
  StartGQLServerOutput,
  StartGQLServerInput
>(async ({ input: { validPlugins } }) => {
  const pluginResolvers = [...validPlugins.values()].flatMap(
    (p) => p.config.resolvers,
  );

  const server = new ApolloServer<ApolloServerContext>({
    cache: redisCache,
    schema: await buildSchema({
      resolvers: [...resolvers, ...pluginResolvers],
    }),
    introspection: process.env["NODE_ENV"] !== "production",
    plugins: [
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
    context: buildContextFunction(),
  });

  initApolloClient(new URL(url));

  return {
    server,
    url,
  };
});
