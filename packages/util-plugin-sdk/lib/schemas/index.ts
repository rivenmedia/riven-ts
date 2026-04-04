import { Type, type } from "arktype";

import {
  BaseDataSource,
  type BaseDataSourceConfig,
} from "../datasource/index.ts";
import { DataSourceMap } from "../utilities/datasource-map.ts";
import { PluginSettings } from "../utilities/plugin-settings.ts";
import { RivenEventHandler } from "./events/index.ts";

import type { RateLimiterOptions } from "bullmq";
import type { Constructor } from "type-fest";

export const RivenPluginConfig = type({
  name: "symbol",
}).readonly();

export type RivenPluginConfig = typeof RivenPluginConfig.infer;

export const basePluginContextSchema = type({
  dataSources: type.instanceOf(DataSourceMap),
});

export type BasePluginContext = typeof basePluginContextSchema.infer;

export const isBasePluginContext = (
  value: unknown,
): value is BasePluginContext => {
  return !(basePluginContextSchema(value) instanceof type.errors);
};

/**
 * Represents a constructor for a class that extends BaseDataSource.
 */
export interface DataSourceConstructor<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any> = any,
> {
  rateLimiterOptions?: RateLimiterOptions | undefined;

  /** Constructor signature */
  new (options: BaseDataSourceConfig<T>): BaseDataSource<T>;
}

const dataSourceSchema = type({
  prototype: {
    constructor: "unknown",
  },
}).as<
  Constructor<
    BaseDataSource<Record<string, unknown>>,
    [BaseDataSourceConfig<Record<string, unknown>>]
  >
>();

export const RivenPlugin = type({
  version: "string.semver",
  name: "symbol",
  "dataSources?": [dataSourceSchema, "...", dataSourceSchema.array()],
  resolvers: "Function[] > 0",
  hooks: type(RivenEventHandler).partial(),
  "context?": type.fn(
    {
      dataSources: type.instanceOf(DataSourceMap),
      settings: type.instanceOf(PluginSettings),
    },
    ":",
    "Record<string, unknown>",
  ),
  settingsSchema: type.instanceOf(Type).as<Type<Record<string, unknown>>>(),
  validator: type.fn(
    {
      dataSources: type.instanceOf(DataSourceMap),
      settings: type.instanceOf(PluginSettings),
    },
    ":",
    "boolean",
  ),
});

export type RivenPlugin = typeof RivenPlugin.infer;

export const RivenPluginPackage = type({
  default: RivenPlugin,
});

export type RivenPluginPackage = typeof RivenPluginPackage.infer;

export { getEventTypeFromSchema } from "./utilities/get-event-type-from-schema.ts";
