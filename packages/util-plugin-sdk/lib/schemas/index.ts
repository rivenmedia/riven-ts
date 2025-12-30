import {
  BaseDataSource,
  type BaseDataSourceConfig,
} from "../datasource/index.ts";
import type { PluginActorLogic } from "../state-machine-helpers/create-plugin-runner.ts";
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

export const SubscribableProgramEvent = z.enum([
  "riven.running",
  "riven.exited",
]);

export type SubscribableProgramEvent = z.infer<typeof SubscribableProgramEvent>;

export interface PublishableProgramEvent {
  type: "media:requested";
  data: RequestedItem;
}

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

export const RivenPlugin = z.object({
  name: z.symbol(),
  dataSources: z
    .array(
      z.custom<Constructor<BaseDataSource, [BaseDataSourceConfig]>>((value) => {
        if (typeof value !== "function") {
          return false;
        }

        return instantiatableSchema.safeParse(value.prototype).success;
      }),
    )
    .min(1)
    .optional(),
  resolvers: z.array(z.instanceof(Function)).min(1),
  getApiToken: z
    .function({
      input: [z.never()],
      output: z.promise(z.string().nullable()),
    })
    .optional(),
  runner: z.custom<PluginActorLogic>((value) => isPluginRunner(value)),
  events: z
    .partialRecord(
      SubscribableProgramEvent,
      z.function({
        input: [z.any()],
        output: z.promise(z.void()),
      }),
    )
    .optional(),
  context: z
    .function({
      input: [
        z.object({
          // TODO: Replace z.any with a more specific type for KeyValueCache
          cache: z.any(),
        }),
      ],
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
