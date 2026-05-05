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
import type { DataSourceMap } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export const CoreKey = Symbol("Riven Core");

export interface ApolloServerContext {
  [CoreKey]: {
    em: EntityManager;
  };
  sendEvent: (event: RivenEvent) => void;
  plugins: Partial<Record<symbol, { dataSources: DataSourceMap }>>;
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
