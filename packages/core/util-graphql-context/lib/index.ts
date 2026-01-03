import { logger } from "@repo/core-util-logger";
import {
  DataSourceMap,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";

import type {
  ApolloServer,
  BaseContext,
  ContextFunction,
  GraphQLRequest,
} from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";

import packageJson from "../package.json" with { type: "json" };

declare module "node:http" {
  interface IncomingMessage {
    body: GraphQLRequest;
  }
}

const { validPlugins } = await parsePluginsFromDependencies(
  packageJson.dependencies,
  import.meta.resolve.bind(null),
);

export function buildContext(
  server: ApolloServer,
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
            });

            dataSources.set(DataSourceConstructor, instance);
          }
        }

        const additionalContext = await plugin.context?.call(plugin, {
          dataSources,
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
