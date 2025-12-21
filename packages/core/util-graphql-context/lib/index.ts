import type { ApolloServer, BaseContext } from "@apollo/server";
import * as pluginListrr from "@repo/plugin-listrr";
// {{plugin-imports}}

/**
 * Base interface that all feature context slices must extend.
 * Each feature package should define its own ContextSlice that extends this.
 */
export interface BaseContextSlice extends BaseContext {
  dataSources: Record<string, unknown>;
}

/**
 * Utility type to merge multiple context slices into a single context type.
 */
export type MergeContextSlices<T extends BaseContextSlice[]> = T extends [
  infer First extends BaseContextSlice,
  ...infer Rest extends BaseContextSlice[],
]
  ? First & MergeContextSlices<Rest>
  : unknown;

export interface FeatureContextSlice extends BaseContextSlice {
  dataSources: Record<string, unknown>;
}

export type Context = MergeContextSlices<
  [
    pluginListrr.ContextSlice,
    // {{plugin-context-slices}}
  ]
>;

export function buildContext(server: ApolloServer<Context>) {
  const { cache } = server;

  // eslint-disable-next-line @typescript-eslint/require-await
  return async function context() {
    return {
      dataSources: {
        listrr: new pluginListrr.datasource({
          cache,
          token: process.env["LISTRR_API_KEY"],
        }),
        // {{plugin-datasources}}
      },
    } satisfies Context;
  };
}
