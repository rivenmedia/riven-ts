import { logger } from "@repo/core-util-logger";

import { ApolloServer } from "@apollo/server";
import { fromPromise } from "xstate";

export const stopGqlServer = fromPromise<undefined, ApolloServer | undefined>(
  async ({ input }) => {
    if (!input) {
      logger.info("GraphQL server is not running; nothing to stop.");

      return;
    }

    logger.info("Stopping GraphQL server...");

    await input.stop();
  },
);
