import { z } from "zod";

import {
  BaseDataSource,
  type BaseDataSourceConfig,
} from "../datasource/index.ts";
import { DataSourceMap } from "../utilities/datasource-map.ts";
import { PluginSettings } from "../utilities/plugin-settings.ts";
import { RivenEventHandler } from "./events/index.ts";

import type { RateLimiterOptions } from "bullmq";
import type { Constructor } from "type-fest";

export const RivenPluginConfig = z.readonly(
  z.object({
    name: z.symbol(),
  }),
);

export type RivenPluginConfig = z.infer<typeof RivenPluginConfig>;

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
 */
export interface DataSourceConstructor<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any> = any,
> {
  rateLimiterOptions?: RateLimiterOptions | undefined;

  /** Constructor signature */
  new (options: BaseDataSourceConfig<T>): BaseDataSource<T>;
}

const dataSourceSchema = z.custom<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Constructor<BaseDataSource<Record<string, any>>>
>((value) => {
  if (typeof value !== "function") {
    return false;
  }

  return instantiatableSchema.safeParse(value.prototype).success;
});

export const RivenPlugin = z.object({
  version: z.string().regex(
    // https://regex101.com/r/vkijKf/1/
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    "Invalid version format",
  ),
  name: z.symbol(),
  dataSources: z.tuple([dataSourceSchema]).rest(dataSourceSchema).optional(),
  resolvers: z.array(z.instanceof(Function)).min(1),
  hooks: z.object(RivenEventHandler).partial(),
  context: z
    .function({
      input: [
        z.object({
          dataSources: z.instanceof(DataSourceMap),
          settings: z.instanceof(PluginSettings),
        }),
      ],
      output: z.promise(z.record(z.string(), z.unknown())),
    })
    .optional(),
  settingsSchema: z.instanceof(z.ZodObject),
  validator: z.function({
    input: [
      z.object({
        settings: z.instanceof(PluginSettings),
      }),
    ],
    output: z.promise(z.boolean()),
  }),
});

export type RivenPlugin = z.input<typeof RivenPlugin>;

export const rivenPluginPackageSchema = z.object({
  default: RivenPlugin,
});

export type RivenPluginPackage = z.infer<typeof rivenPluginPackageSchema>;
