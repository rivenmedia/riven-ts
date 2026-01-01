import { ApolloServer } from "@apollo/server";
import { logger } from "@repo/core-util-logger";
import { fromPromise } from "xstate";

export const stopGqlServer = fromPromise<undefined, ApolloServer | null>(
  async ({ input }) => {
    if (!input) {
      logger.info("GraphQL server is not running; nothing to stop.");

      return;
    }

    logger.info("Stopping GraphQL server...");

    await input.stop();
  },
);
