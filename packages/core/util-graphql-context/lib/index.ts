import packageJson from "../package.json" with { type: "json" };
import type { ApolloServer, BaseContext } from "@apollo/server";
import { parsePluginsFromDependencies } from "@repo/util-plugin-sdk";

const plugins = await parsePluginsFromDependencies(
  packageJson.dependencies,
  import.meta.resolve.bind(null),
);

/**
 * Utility type to merge multiple context slices into a single context type.
 */
export type MergeContextSlices<T extends BaseContext[]> = T extends [
  infer First extends BaseContext,
  ...infer Rest extends BaseContext[],
]
  ? First & MergeContextSlices<Rest>
  : unknown;

export interface FeatureContextSlice extends BaseContext {
  dataSources: Record<string, unknown>;
}

export type Context = MergeContextSlices<
  [
    // pluginListrr.ContextSlice,
    // {{plugin-context-slices}}
  ]
>;

export function buildContext(server: ApolloServer) {
  const { cache } = server;

  return async function context() {
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
    } satisfies Context;
  };
}
