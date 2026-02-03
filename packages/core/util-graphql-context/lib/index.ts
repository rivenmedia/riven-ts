import { logger } from "@repo/core-util-logger";
import { DataSourceMap, type RivenPlugin } from "@repo/util-plugin-sdk";
import { z } from "@repo/util-plugin-sdk/validation";

import type {
  ApolloServer,
  BaseContext,
  ContextFunction,
  GraphQLRequest,
} from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

declare module "node:http" {
  interface IncomingMessage {
    body: GraphQLRequest;
  }
}

export function buildContext(
  server: ApolloServer,
  settings: PluginSettings,
  validPlugins: RivenPlugin[],
): ContextFunction<[StandaloneServerContextFunctionArgument]> {
  const { cache } = server;

  return async function context({ req }) {
    if (req.body.operationName) {
      logger.http(`Received ${req.body.operationName} query`);
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
              redisUrl: z.url().parse(process.env["REDIS_URL"]),
              settings: settings.get(plugin.settingsSchema),
            });

            dataSources.set(DataSourceConstructor, instance);
          }
        }

        const additionalContext = await plugin.context?.call(plugin, {
          dataSources,
          settings,
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
          return {
            ...acc,
            [pluginSymbol]: pluginContext,
          };
        },
        {},
      ),
    } satisfies BaseContext;
  };
}
