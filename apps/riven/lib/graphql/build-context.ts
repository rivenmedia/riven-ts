import { DataSourceMap, type RivenPlugin } from "@repo/util-plugin-sdk";

import { database } from "../database/database.ts";
import { logger } from "../utilities/logger/logger.ts";
import { settings } from "../utilities/settings.ts";
import { telemetry } from "../utilities/telemetry.ts";

import type {
  ApolloServer,
  ContextFunction,
  GraphQLRequest,
} from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";
import type { ApolloServerContext } from "@repo/core-util-graphql-schema";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

declare module "node:http" {
  interface IncomingMessage {
    body: GraphQLRequest;
  }
}

export function buildContext(
  server: ApolloServer<ApolloServerContext>,
  pluginSettings: PluginSettings,
  validPlugins: RivenPlugin[],
): ContextFunction<
  [StandaloneServerContextFunctionArgument],
  ApolloServerContext
> {
  const { cache } = server;

  return async function context({ req }) {
    if (
      req.body.operationName &&
      req.body.operationName !== "IntrospectionQuery"
    ) {
      const isMutation = req.body.query?.startsWith("mutation");

      logger.http(
        `Received ${req.body.operationName} ${isMutation ? "mutation" : "query"}`,
        {
          "riven.gql.operation-name": req.body.operationName,
          "riven.gql.is-mutation": isMutation,
        },
      );
    }

    const pluginContexts = await Promise.all(
      validPlugins.map<Promise<[symbol, unknown]>>(async (plugin) => {
        const dataSources = new DataSourceMap();

        if (plugin.dataSources) {
          for (const DataSourceConstructor of plugin.dataSources) {
            const instance = new DataSourceConstructor({
              cache,
              logger,
              pluginSymbol: plugin.name,
              connection: {
                url: settings.redisUrl,
              },
              settings: pluginSettings.get(plugin.settingsSchema),
              telemetry,
            });

            dataSources.set(DataSourceConstructor, instance);
          }
        }

        const additionalContext = await plugin.context?.call(plugin, {
          dataSources,
          settings: pluginSettings,
        });

        const pluginContext = {
          ...additionalContext,
          dataSources,
        };

        return [plugin.name, pluginContext];
      }),
    );

    return {
      ...pluginContexts.reduce<Record<symbol, unknown>>(
        (acc, [pluginSymbol, pluginContext]) => {
          acc[pluginSymbol] = pluginContext;

          return acc;
        },
        {},
      ),
      em: database.em.fork(),
    } satisfies ApolloServerContext;
  };
}
