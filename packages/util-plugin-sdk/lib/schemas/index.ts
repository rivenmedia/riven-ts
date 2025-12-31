import {
  BaseDataSource,
  type BaseDataSourceConfig,
} from "../datasource/index.ts";
import type { PluginActorLogic } from "../state-machine-helpers/create-plugin-runner.ts";
import { DataSourceMap } from "../types/utilities.ts";
import type { Constructor } from "type-fest";
import { z } from "zod";

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

const pluginRunnerSchema = z.object({
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

const isPluginRunner = (value: unknown): value is PluginActorLogic => {
  return pluginRunnerSchema.safeParse(value).success;
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

const dataSourceSchema = z.custom<
  Constructor<BaseDataSource, [BaseDataSourceConfig]>
>((value) => {
  if (typeof value !== "function") {
    return false;
  }

  return instantiatableSchema.safeParse(value.prototype).success;
});

export const RivenPlugin = z.object({
  name: z.symbol(),
  dataSources: z.tuple([dataSourceSchema]).rest(dataSourceSchema).optional(),
  resolvers: z.array(z.instanceof(Function)).min(1),
  runner: z.custom<PluginActorLogic>((value) => isPluginRunner(value)),
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
