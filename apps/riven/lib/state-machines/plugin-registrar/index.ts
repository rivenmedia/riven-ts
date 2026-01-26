import { logger } from "@repo/core-util-logger";
import { DataSourceMap, type ParsedPlugins } from "@repo/util-plugin-sdk";

import { type AnyActorRef, type MachineContext, assign, setup } from "xstate";
import z from "zod";

import { redisCache } from "../../utilities/redis-cache.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import {
  type InvalidPlugin,
  type RegisteredPlugin,
  type ValidPlugin,
  collectPluginsForRegistration,
} from "./actors/collect-plugins-for-registration.actor.ts";
import {
  type RegisterPluginHookWorkersOutput,
  registerPluginHookWorkers,
} from "./actors/register-plugin-hook-workers.actor.ts";
import { validatePlugin } from "./actors/validate-plugin.actor.ts";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { Queue, Worker } from "bullmq";

export interface PluginRegistrarMachineContext extends MachineContext {
  rootRef: AnyActorRef;
  parsedPlugins?: ParsedPlugins;
  runningValidators: Map<symbol, AnyActorRef>;
  pendingPlugins: Map<symbol, RegisteredPlugin>;
  invalidPlugins: Map<symbol, InvalidPlugin>;
  validPlugins: Map<symbol, ValidPlugin>;
  pluginQueues: Map<symbol, Map<RivenEvent["type"], Queue>>;
  pluginWorkers: Map<symbol, Map<RivenEvent["type"], Worker>>;
  publishableEvents: Set<RivenEvent["type"]>;
}

export interface PluginRegistrarMachineInput {
  rootRef: AnyActorRef;
}

export interface PluginRegistrarMachineOutput {
  validPlugins: Map<symbol, ValidPlugin>;
  invalidPlugins: Map<symbol, InvalidPlugin>;
  pluginQueues: Map<symbol, Map<RivenEvent["type"], Queue>>;
  pluginWorkers: Map<symbol, Map<RivenEvent["type"], Worker>>;
  publishableEvents: Set<RivenEvent["type"]>;
}

export type PluginRegistrarMachineEvent =
  | { type: "riven.plugin-valid"; plugin: ValidPlugin }
  | { type: "riven.plugin-invalid"; plugin: InvalidPlugin };

export const pluginRegistrarMachine = setup({
  types: {
    context: {} as PluginRegistrarMachineContext,
    input: {} as PluginRegistrarMachineInput,
    events: {} as PluginRegistrarMachineEvent,
    children: {} as {
      collectPluginsForRegistration: "collectPluginsForRegistration";
      registerPluginHookWorkers: "registerPluginHookWorkers";
      validatePlugin: "validatePlugin";
    },
    output: {} as PluginRegistrarMachineOutput,
  },
  actions: {
    registerPlugins: assign({
      pendingPlugins: (_, { validPlugins }: ParsedPlugins) => {
        const pluginMap = new Map<symbol, RegisteredPlugin>();

        for (const plugin of validPlugins) {
          const dataSources = new DataSourceMap();

          if (plugin.dataSources) {
            for (const DataSource of plugin.dataSources) {
              try {
                const token = DataSource.getApiToken();
                const instance = new DataSource({
                  pluginSymbol: plugin.name,
                  cache: redisCache,
                  token,
                  logger,
                  redisUrl: z.url().parse(process.env["REDIS_URL"]),
                });

                dataSources.set(DataSource, instance);
              } catch (error) {
                logger.error(
                  `Failed to construct data source ${DataSource.name} for ${plugin.name.toString()}: ${
                    (error as Error).message
                  }`,
                );
              }
            }
          }

          pluginMap.set(plugin.name, {
            status: "registered",
            config: plugin,
            dataSources,
          });
        }

        return pluginMap;
      },
    }),
    handleValidPlugin: assign(
      (
        { context: { pendingPlugins, validPlugins } },
        validPlugin: ValidPlugin,
      ) => {
        const existingPendingItem = pendingPlugins.get(validPlugin.config.name);

        if (!existingPendingItem) {
          logger.error(
            `Received valid plugin notification for unknown plugin: ${validPlugin.config.name.toString()}`,
          );

          return;
        }

        const newPendingPlugins = new Map(pendingPlugins);

        newPendingPlugins.delete(validPlugin.config.name);

        return {
          pendingPlugins: newPendingPlugins,
          validPlugins: validPlugins.set(validPlugin.config.name, validPlugin),
        };
      },
    ),
    handleInvalidPlugin: assign(
      (
        { context: { pendingPlugins, invalidPlugins } },
        invalidPlugin: InvalidPlugin,
      ) => {
        const existingPendingItem = pendingPlugins.get(
          invalidPlugin.config.name,
        );

        if (!existingPendingItem) {
          logger.error(
            `Received invalid plugin notification for unknown plugin: ${String(
              invalidPlugin.config.name,
            )}`,
          );

          return {};
        }

        const newPendingPlugins = new Map(pendingPlugins);

        newPendingPlugins.delete(invalidPlugin.config.name);

        return {
          pendingPlugins: newPendingPlugins,
          invalidPlugins: invalidPlugins.set(
            invalidPlugin.config.name,
            invalidPlugin,
          ),
        };
      },
    ),
    spawnValidators: assign(({ spawn, context: { pendingPlugins } }) => {
      const validatorRefs = new Map<symbol, AnyActorRef>();

      for (const [pluginSymbol, plugin] of pendingPlugins) {
        const validatorRef = spawn("validatePlugin", {
          id: "validatePlugin",
          input: { plugin },
        });

        validatorRefs.set(pluginSymbol, validatorRef);
      }

      return {
        runningValidators: validatorRefs,
      };
    }),
    assignPluginHooks: assign(
      (
        _,
        {
          pluginQueues,
          pluginWorkers,
          publishableEvents,
        }: RegisterPluginHookWorkersOutput,
      ) => {
        return {
          pluginQueues,
          pluginWorkers,
          publishableEvents,
        };
      },
    ),
  },
  actors: {
    collectPluginsForRegistration,
    validatePlugin,
    registerPluginHookWorkers,
  },
  guards: {
    allPluginsValidated: ({ context: { pendingPlugins } }) =>
      pendingPlugins.size === 0,
    isPluginValid: (_, isValid: boolean) => isValid,
  },
})
  .extend(withLogAction)
  .createMachine({
    context: ({ input }) => ({
      pendingPlugins: new Map(),
      invalidPlugins: new Map(),
      validPlugins: new Map(),
      runningValidators: new Map(),
      rootRef: input.rootRef,
      pluginQueues: new Map(),
      pluginWorkers: new Map(),
      publishableEvents: new Set(),
    }),
    id: "Plugin registrar",
    initial: "Registering plugins",
    output: ({
      context: {
        validPlugins,
        invalidPlugins,
        pluginQueues,
        pluginWorkers,
        publishableEvents,
      },
    }) => ({
      validPlugins,
      invalidPlugins,
      pluginQueues,
      pluginWorkers,
      publishableEvents,
    }),
    states: {
      "Registering plugins": {
        invoke: {
          id: "collectPluginsForRegistration",
          src: "collectPluginsForRegistration",
          onDone: {
            target: "Validating",
            actions: [
              assign({
                parsedPlugins: ({ event: { output: parsedPlugins } }) =>
                  parsedPlugins,
              }),
              {
                type: "registerPlugins",
                params: ({ event: { output: parsedPlugins } }) => parsedPlugins,
              },
            ],
          },
        },
      },
      Validating: {
        entry: "spawnValidators",
        always: {
          guard: "allPluginsValidated",
          target: "Registering plugin hook workers",
          actions: {
            type: "log",
            params: {
              message: "Plugin validation complete.",
            },
          },
        },
        on: {
          "riven.plugin-valid": {
            actions: [
              {
                type: "handleValidPlugin",
                params: ({ event: { plugin } }) => plugin,
              },
            ],
          },
          "riven.plugin-invalid": {
            actions: {
              type: "handleInvalidPlugin",
              params: ({ event: { plugin } }) => plugin,
            },
          },
        },
      },
      "Registering plugin hook workers": {
        invoke: {
          id: "registerPluginHookWorkers",
          src: "registerPluginHookWorkers",
          input: ({ context: { validPlugins } }) => ({
            plugins: validPlugins,
          }),
          onDone: {
            actions: {
              type: "assignPluginHooks",
              params: ({ event: { output } }) => output,
            },
            target: "Validated",
          },
        },
      },
      Validated: {
        type: "final",
      },
    },
  });
