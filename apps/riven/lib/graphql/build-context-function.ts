import { type ApolloServerContext, CoreKey } from "./context.ts";

import type { ContextFunction } from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";

export const buildContextFunction: (
  sendEvent: GraphQLContext["sendEvent"],
) => ContextFunction<
  [StandaloneServerContextFunctionArgument],
  ApolloServerContext
> = (sendEvent) => async () => {
  const { logger } = await import("../utilities/logger/logger.ts");
  const { database, services } = await import("../database/database.ts");

  return {
    [CoreKey]: {
      em: database.em.fork(),
      services,
    },
    logger,
    sendEvent,
    plugins: {},
  };
};
