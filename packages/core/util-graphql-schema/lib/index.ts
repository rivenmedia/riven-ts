import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";

import { BigIntResolver, JSONObjectResolver } from "graphql-scalars";
import {
  type BuildSchemaOptions,
  buildSchema as baseBuildSchema,
} from "type-graphql";

import type { EntityManager } from "@mikro-orm/core";
import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { DataSourceMap } from "@repo/util-plugin-sdk/utilities/datasource-map";
import type { Queue } from "bullmq";

export const CoreKey = Symbol("Riven Core");

/**
 * Symbol slot on {@link ApolloServerContext} that holds admin-surface
 * resources — the registered plugin map and a flat view of every BullMQ
 * queue currently owned by the main-runner actor.
 *
 * Populated per request by `buildContextFunction` (see
 * `apps/riven/lib/graphql/build-context-function.ts`). Consumed by the
 * admin GraphQL resolvers via the `AdminContext` parameter decorator.
 */
export const AdminKey = Symbol("Riven Admin");

/**
 * Shape of the admin slot. `plugins` is the broad registered-plugin map
 * (includes pending / invalid plugins where available); resolvers should
 * filter on `status` if they only want valid plugins. `queues` is a flat
 * `Map<string, Queue>` keyed by an unambiguous string name — flow queues
 * use the flow name, sandboxed queues use the job name, and plugin
 * queues use `plugin:<pluginSymbolDescription>:<eventType>`.
 */
export interface AdminContextSlot {
  plugins: AdminPluginRecord;
  queues: Map<string, Queue>;
}

/**
 * Read-only structural mirror of `RegisteredPluginMap` from the riven
 * app, declared with the SDK-level types directly so resolvers can
 * project fields without re-narrowing. Sits in the lower-level
 * `util-graphql-schema` package so app code doesn't need to import
 * back into the bootstrap layer.
 *
 * Keyed by plugin symbol. The `error` field is present only for
 * `status: "invalid"` entries; resolvers should narrow on `status`.
 */
export type AdminPluginRecord = ReadonlyMap<
  symbol,
  | {
      status: "registered" | "valid";
      config: RivenPlugin;
      dataSources: DataSourceMap;
    }
  | {
      status: "invalid";
      config: RivenPlugin;
      dataSources: DataSourceMap;
      error: unknown;
    }
>;

export interface ApolloServerContext extends GraphQLContext {
  [CoreKey]: {
    em: EntityManager;
  };
  [AdminKey]: AdminContextSlot;
}

export const buildSchema = async (
  options: Omit<BuildSchemaOptions, "resolvers"> & {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    resolvers?: readonly Function[] | undefined;
  },
) =>
  baseBuildSchema({
    ...options,
    resolvers: [
      CoreSettingsResolver,
      RivenSettingsResolver,
      ...(options.resolvers ?? []),
    ],
    scalarsMap: [
      { type: BigInt, scalar: BigIntResolver },
      { type: Object, scalar: JSONObjectResolver },
    ],
    validate: true,
  });
