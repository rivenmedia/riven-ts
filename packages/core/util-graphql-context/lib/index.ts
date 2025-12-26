import packageJson from "../package.json" with { type: "json" };
import type {
  ApolloServer,
  BaseContext,
  ContextFunction,
} from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";
import { logger } from "@repo/core-util-logger";
import { parsePluginsFromDependencies } from "@repo/util-plugin-sdk";

const plugins = await parsePluginsFromDependencies(
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
      plugins.map<Promise<[symbol, unknown]>>(async (plugin) => [
        plugin.name,
        await plugin.context?.call(plugin, { cache }),
      ]),
    );

    return {
      ...pluginContexts.reduce<Record<symbol, unknown>>(
        (acc, [pluginName, pluginContext]) => {
          return {
            ...acc,
            [pluginName]: pluginContext,
          };
        },
        {},
      ),
    } satisfies BaseContext;
  };
}
