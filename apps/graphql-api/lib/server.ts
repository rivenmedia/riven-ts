import "reflect-metadata";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { postgresDataSource } from "@repo/core-util-database/connection";
import { buildSchema } from "type-graphql";
import { logger } from "@repo/core-util-logger";
import { ListrrResolver } from "@repo/listrr-data-access-api/resolver";

try {
  await postgresDataSource.initialize();

  logger.info("Database connected successfully");
} catch (error) {
  logger.emerg("Error during database initialisation:", error);
  process.exit(1);
}

const PORT = process.env["PORT"] ?? 3000;

logger.info("Building GraphQL schema...");

const schema = await buildSchema({
  resolvers: [ListrrResolver],
});

logger.info("GraphQL schema built successfully");
logger.info("Starting GraphQL server...");

const server = new ApolloServer({
  schema,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: Number(PORT) },
});

logger.info(`🚀 GraphQL server ready at ${url}`);
