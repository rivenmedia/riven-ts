import { fromPromise } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";

import type { ApolloServerContext } from "../../../graphql/context.ts";
import type { ApolloServer } from "@apollo/server";
import type { INestApplicationContext } from "@nestjs/common";

export interface StopGqlServerInput {
  applicationContext: INestApplicationContext | undefined;
  server: ApolloServer<ApolloServerContext> | undefined;
}

export const stopGqlServer = fromPromise<undefined, StopGqlServerInput>(
  async ({ input: { applicationContext, server } }) => {
    if (server) {
      logger.info("Stopping GraphQL server...");

      await server.stop();
    } else {
      logger.info("GraphQL server is not running; nothing to stop.");
    }

    // Torn down alongside the server, since the container backs the resolvers
    // the server was serving.
    if (applicationContext) {
      logger.debug("Closing the application context...");

      await applicationContext.close();
    }
  },
);
