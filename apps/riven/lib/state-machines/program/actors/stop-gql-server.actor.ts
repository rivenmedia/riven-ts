import { ApolloServer } from "@apollo/server";
import { fromPromise } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

export const stopGqlServer = fromPromise<
  undefined,
  ApolloServer<ApolloServerContext> | undefined
>(async ({ input }) => {
  if (!input) {
    logger.info("GraphQL server is not running; nothing to stop.");

    return;
  }

  logger.info("Stopping GraphQL server...");

  await input.stop();
});
