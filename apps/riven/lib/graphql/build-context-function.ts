import { database, services } from "../database/database.ts";
import { logger } from "../utilities/logger/logger.ts";
import { type ApolloServerContext, CoreKey } from "./context.ts";

import type { ContextFunction } from "@apollo/server";
import type { ExpressContextFunctionArgument } from "@as-integrations/express5";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";

export const buildContextFunction: (
  sendEvent: GraphQLContext["sendEvent"],
) => ContextFunction<[ExpressContextFunctionArgument], ApolloServerContext> =
  (sendEvent) => () =>
    Promise.resolve({
      [CoreKey]: {
        em: database.em.fork(),
        services,
      },
      logger,
      sendEvent,
      plugins: {},
    });
