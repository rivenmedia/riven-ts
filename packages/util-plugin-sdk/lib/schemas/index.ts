import type { RateLimiterOpts } from "limiter";
import { z } from "zod";

import {
  BaseDataSource,
  type BaseDataSourceConfig,
} from "../datasource/index.ts";
import type { PluginRunnerLogic } from "../state-machine-helpers/create-plugin-runner.ts";
import { DataSourceMap } from "../types/utilities.ts";

export const RivenPluginConfig = z.readonly(
  z.object({
    name: z.symbol(),
  }),
);

export type RivenPluginConfig = z.infer<typeof RivenPluginConfig>;

export const requestedItemSchema = z.object({
  imdbId: z.string().optional(),
  tmdbId: z.string().optional(),
  tvdbId: z.string().optional(),
});

export type RequestedItem = z.infer<typeof requestedItemSchema>;

const actorSchema = z.object({
  config: z.function(),
  start: z.function({
    input: z.any(),
  }),
  transition: z.function({
    input: z.any(),
  }),
  getInitialSnapshot: z.function({
    input: z.any(),
  }),
  getPersistedSnapshot: z.function({
    input: z.any(),
    output: z.any(),
  }),
});

type Actor = z.infer<typeof actorSchema>;

const isActor = (value: unknown): value is Actor => {
  return actorSchema.safeParse(value).success;
};

const instantiatableSchema = z.object({
  constructor: z.any(),
});

export const basePluginContextSchema = z.object({
  dataSources: z.instanceof(DataSourceMap),
});

export type BasePluginContext = z.infer<typeof basePluginContextSchema>;

export const isBasePluginContext = (
  value: unknown,
): value is BasePluginContext => {
  return basePluginContextSchema.safeParse(value).success;
};

/**
 * Represents a constructor for a class that extends BaseDataSource.
 * This type preserves both instance members and static members.
 */
export interface DataSourceConstructor {
  rateLimiterOptions?: RateLimiterOpts;

  /** Static method to get the API token */
  getApiToken(): string | undefined;

  /** Constructor signature */
  new (options: BaseDataSourceConfig): BaseDataSource;
}

const dataSourceSchema = z.custom<DataSourceConstructor>((value) => {
  if (typeof value !== "function") {
    return false;
  }

  // Check it has the static getApiToken method
  if (typeof (value as DataSourceConstructor).getApiToken !== "function") {
    return false;
  }

  return instantiatableSchema.safeParse(value.prototype).success;
});

export const RivenPlugin = z.object({
  name: z.symbol(),
  dataSources: z.tuple([dataSourceSchema]).rest(dataSourceSchema).optional(),
  resolvers: z.array(z.instanceof(Function)).min(1),
  runner: z.custom<PluginRunnerLogic>((value) => isActor(value)),
  context: z
    .function({
      input: [
        z.object({
          dataSources: z.instanceof(DataSourceMap),
        }),
      ],
      output: z.promise(z.record(z.string(), z.unknown())),
    })
    .optional(),
  validator: z.function({
    output: z.union([z.promise(z.boolean()), z.boolean()]),
  }),
});

export type RivenPlugin = z.infer<typeof RivenPlugin>;

export const isRivenPluginPackage = (
  obj: unknown,
): obj is { default: RivenPlugin } => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const maybePlugin = (obj as { default?: unknown }).default;

  return RivenPlugin.safeParse(maybePlugin).success;
};
