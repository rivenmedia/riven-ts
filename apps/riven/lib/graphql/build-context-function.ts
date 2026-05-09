import {
  type ApolloServerContext,
  CoreKey,
} from "@repo/core-util-graphql-schema";

import { database } from "../database/database.ts";
import { logger } from "../utilities/logger/logger.ts";

import type { ContextFunction } from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";

export const buildContextFunction: (
  sendEvent: GraphQLContext["sendEvent"],
) => ContextFunction<
  [StandaloneServerContextFunctionArgument],
  ApolloServerContext
> = (sendEvent) => () =>
  Promise.resolve({
    [CoreKey]: {
      em: database.em.fork(),
    },
    logger,
    sendEvent,
    plugins: {},
  });
