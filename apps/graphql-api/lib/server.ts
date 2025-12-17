import "reflect-metadata";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { postgresDataSource } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { schema } from "@repo/core-util-graphql-schema";
import type { Context } from "@repo/core-util-graphql-schema/context";
import { ListrrAPI } from "@repo/listrr-data-access-api/data-source";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

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
  cache: new InMemoryLRUCache(),
  schema,
  introspection: true,
  formatError(formattedError, error) {
    logger.error("GraphQL Error:", { error });

    return formattedError;
  },
});

try {
  const { url } = await startStandaloneServer(server, {
    listen: {
      port: PORT,
    },
    async context() {
      return {
        dataSources: {
          listrr: new ListrrAPI(process.env["LISTRR_API_KEY"]),
        },
      } satisfies Context;
    },
  });

  logger.info(`🚀 GraphQL server ready at ${url}`);
} catch (error) {
  logger.emerg("Error starting GraphQL server:", error);

  process.exit(1);
}
