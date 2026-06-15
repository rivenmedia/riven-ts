import { database, services } from "../database/database.ts";
import { logger } from "../utilities/logger/logger.ts";
import { type ApolloServerContext, CoreKey } from "./context.ts";

import type { ValidPluginMap } from "../types/plugins.ts";
import type { ContextFunction } from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

export const buildContextFunction =
  (
    sendEvent: GraphQLContext["sendEvent"],
    plugins: ValidPluginMap,
    pluginSettings: PluginSettings,
  ): ContextFunction<
    [StandaloneServerContextFunctionArgument],
    ApolloServerContext
  > =>
  () =>
    Promise.resolve({
      get [CoreKey]() {
        return {
          em: database.em.fork(),
          services,
        };
      },
      logger,
      sendEvent,
      plugins,
      pluginSettings,
    });
