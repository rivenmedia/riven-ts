import { ApolloServer } from "@apollo/server";
import { fromPromise } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";

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
