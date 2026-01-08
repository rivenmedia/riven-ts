import { z } from "zod";

import {
  BaseDataSource,
  type BaseDataSourceConfig,
} from "../datasource/index.ts";
import { DataSourceMap } from "../types/utilities.ts";
import { PluginToProgramEvent } from "./plugin-to-program-events/index.ts";
import { CoreStartedEventHandler } from "./program-to-plugin-events/core/started.ts";
import { ProgramToPluginEvent } from "./program-to-plugin-events/index.ts";
import { MediaItemCreationAlreadyExistsEventHandler } from "./program-to-plugin-events/media-item/creation/already-exists.ts";
import { MediaItemCreationErrorEventHandler } from "./program-to-plugin-events/media-item/creation/error.ts";
import { MediaItemCreationSuccessEventHandler } from "./program-to-plugin-events/media-item/creation/success.ts";

import type { createEventHandlerSchema } from "./utilities/create-event-handler-schema.ts";
import type { RateLimiterOptions } from "bullmq";

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
 * This type preserves both instance members and static members.
 */
export interface DataSourceConstructor {
  rateLimiterOptions?: RateLimiterOptions | undefined;

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

export const hooksMap = {
  "riven.core.started": CoreStartedEventHandler,
  "riven.media-item.creation.already-exists":
    MediaItemCreationAlreadyExistsEventHandler,
  "riven.media-item.creation.error": MediaItemCreationErrorEventHandler,
  "riven.media-item.creation.success": MediaItemCreationSuccessEventHandler,
} satisfies Record<ProgramToPluginEvent["type"], z.ZodFunction>;

export const RivenPlugin = z.object({
  name: z.symbol(),
  dataSources: z.tuple([dataSourceSchema]).rest(dataSourceSchema).optional(),
  resolvers: z.array(z.instanceof(Function)).min(1),
  hooks: z.object(hooksMap).partial(),
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

export const rivenPluginPackageSchema = z.object({
  default: RivenPlugin,
});

export type RivenPluginPackage = z.infer<typeof rivenPluginPackageSchema>;

export type EventHandler = z.infer<ReturnType<typeof createEventHandlerSchema>>;

export const RivenEvent = z.discriminatedUnion("type", [
  ...PluginToProgramEvent.options,
  ...ProgramToPluginEvent.options,
]);

export type RivenEvent = z.infer<typeof RivenEvent>;
