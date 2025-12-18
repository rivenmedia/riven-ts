import type { ApolloServer, BaseContext } from "@apollo/server";
import {
  ListrrAPI,
  type ListrrContextSlice,
} from "@repo/listrr-data-access-api/data-source";

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
  : {};

export interface FeatureContextSlice extends BaseContextSlice {
  dataSources: Record<string, unknown>;
}

export type Context = MergeContextSlices<[ListrrContextSlice]>;

export function buildContext(server: ApolloServer<Context>) {
  const { cache } = server;

  return async function context() {
    return {
      dataSources: {
        listrr: new ListrrAPI({
          cache,
          token: process.env["LISTRR_API_KEY"],
        }),
      },
    } satisfies Context;
  };
}
