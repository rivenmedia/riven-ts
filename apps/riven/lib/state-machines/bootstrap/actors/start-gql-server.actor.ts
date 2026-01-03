import { buildContext } from "@repo/core-util-graphql-context";
import { schema } from "@repo/core-util-graphql-schema";
import { logger } from "@repo/core-util-logger";

import { ApolloServer, type BaseContext } from "@apollo/server";
import responseCachePlugin from "@apollo/server-plugin-response-cache";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { startStandaloneServer } from "@apollo/server/standalone";
import { fromPromise } from "xstate";

import { redisCache } from "../../../utils/redis-cache.ts";

export interface StartGQLServerOutput {
  server: ApolloServer;
  url: string;
}

export const startGqlServer = fromPromise<StartGQLServerOutput>(async () => {
  const PORT = Number(process.env["PORT"]) || 3000;

  const server = new ApolloServer<BaseContext>({
    cache: redisCache,
    schema,
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

  const { url } = await startStandaloneServer<BaseContext>(server, {
    listen: {
      port: PORT,
    },
    context: buildContext(server),
  });

  return {
    server,
    url,
  };
});
