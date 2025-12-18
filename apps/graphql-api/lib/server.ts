import "reflect-metadata";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { postgresDataSource } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { schema } from "@repo/core-util-graphql-schema";
import { type Context, buildContext } from "@repo/core-util-graphql-context";
import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { Keyv } from "keyv";
import KeyvRedis from "@keyv/redis";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import responseCachePlugin from "@apollo/server-plugin-response-cache";

try {
  await postgresDataSource.initialize();

  logger.info("Database connected successfully");
} catch (error) {
  logger.emerg("Error during database initialisation:", error);

  process.exit(1);
}

const PORT = Number(process.env["PORT"]) || 3000;

logger.info("Starting GraphQL server...");

const server = new ApolloServer<Context>({
  cache: new KeyvAdapter(
    new Keyv(new KeyvRedis(process.env["REDIS_URL"])) as any,
  ),
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

try {
  const { url } = await startStandaloneServer<Context>(server, {
    listen: {
      port: PORT,
    },
    context: buildContext(server),
  });

  logger.info(`🚀 GraphQL server ready at ${url}`);
} catch (error) {
  logger.emerg("Error starting GraphQL server:", error);

  process.exit(1);
}
