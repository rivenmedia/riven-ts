import { DataSourceMap } from "@repo/util-plugin-sdk";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { type AnyActorRef, type MachineContext, assign, setup } from "xstate";
import z, { ZodError } from "zod";

import { logger } from "../../utilities/logger/logger.ts";
import { redisCache } from "../../utilities/redis-cache.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import {
  type ParsedPlugins,
  collectPluginsForRegistration,
} from "./actors/collect-plugins-for-registration.actor.ts";
import {
  type RegisterPluginHookWorkersOutput,
  registerPluginHookWorkers,
} from "./actors/register-plugin-hook-workers.actor.ts";
import { validatePlugin } from "./actors/validate-plugin.actor.ts";

import type {
  InvalidPlugin,
  InvalidPluginMap,
  PendingPlugin,
  PendingPluginMap,
  PluginQueueMap,
  PluginWorkerMap,
  PublishableEventSet,
  ValidPlugin,
  ValidPluginMap,
} from "../../types/plugins.ts";

export interface PluginRegistrarMachineContext extends MachineContext {
  rootRef: AnyActorRef;
  parsedPlugins: ParsedPlugins | null;
  runningValidators: Map<symbol, AnyActorRef>;
  pendingPlugins: PendingPluginMap;
  invalidPlugins: InvalidPluginMap;
  validPlugins: ValidPluginMap;
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
  publishableEvents: PublishableEventSet;
  settings: PluginSettings | null;
}

export interface PluginRegistrarMachineInput {
  rootRef: AnyActorRef;
}

export interface PluginRegistrarMachineOutput {
  validPlugins: ValidPluginMap;
  invalidPlugins: InvalidPluginMap;
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
  publishableEvents: PublishableEventSet;
  settings: PluginSettings;
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
      pendingPlugins: (
        _,
        { validPlugins, pluginConfigPrefixMap, pluginSettings }: ParsedPlugins,
      ) => {
        const pluginMap = new Map<symbol, PendingPlugin>();

        for (const plugin of validPlugins) {
          const dataSources = new DataSourceMap();

          try {
            const pluginConfigPrefix = pluginConfigPrefixMap.get(plugin.name);

            if (!pluginConfigPrefix) {
              throw new Error(
                `No config prefix found for plugin "${String(plugin.name)}"`,
              );
            }

            pluginSettings._set(pluginConfigPrefix, plugin.settingsSchema);
          } catch (error) {
            if (error instanceof ZodError) {
              logger.error(
                `Invalid settings provided for plugin '${String(plugin.name.description)}: ${z.prettifyError(error)}'`,
              );
            } else {
              logger.error(
                `Failed to set settings for plugin '${String(
                  plugin.name.description,
                )}': ${String(error)}`,
              );
            }

            continue;
          }

          if (plugin.dataSources) {
            for (const DataSource of plugin.dataSources) {
              try {
                const instance = new DataSource({
                  pluginSymbol: plugin.name,
                  cache: redisCache,
                  logger,
                  connection: {
                    url: settings.redisUrl,
                  },
                  settings: pluginSettings.get(plugin.settingsSchema),
                  telemetry,
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

        pluginSettings._lock();

        return pluginMap;
      },
      settings: (_, { pluginSettings }) => pluginSettings,
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
    spawnValidators: assign(
      ({ spawn, context: { pendingPlugins, settings } }) => {
        const validatorRefs = new Map<symbol, AnyActorRef>();

        if (!settings) {
          throw new Error(
            "PluginSettings is not initialised. Have the plugins been registered?",
          );
        }

        for (const [pluginSymbol, plugin] of pendingPlugins) {
          const validatorRef = spawn("validatePlugin", {
            id: "validatePlugin",
            input: {
              plugin,
              settings,
            },
          });

          validatorRefs.set(pluginSymbol, validatorRef);
        }

        return {
          runningValidators: validatorRefs,
        };
      },
    ),
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
      settings: null,
      parsedPlugins: null,
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
        settings,
      },
    }) => {
      if (!settings) {
        throw new Error(
          "PluginSettings is not available in the output context.",
        );
      }

      return {
        validPlugins,
        invalidPlugins,
        pluginQueues,
        pluginWorkers,
        publishableEvents,
        settings,
      };
    },
    states: {
      "Registering plugins": {
        invoke: {
          id: "collectPluginsForRegistration",
          src: "collectPluginsForRegistration",
          onDone: {
            target: "Validating",
            actions: [
              {
                type: "log",
                params: ({ event: { output: parsedPlugins } }) => ({
                  message: [
                    `Collected ${parsedPlugins.validPlugins.length.toString()} plugins for validation:`,
                    parsedPlugins.validPlugins
                      .map((p) => p.name.description?.toString())
                      .join(", "),
                  ].join(" "),
                  level: "verbose",
                }),
              },
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
          input: ({ context: { validPlugins, settings } }) => {
            if (!settings) {
              throw new Error(
                "PluginSettings is not initialised. Have the plugins been registered?",
              );
            }

            return {
              plugins: validPlugins,
              settings,
            };
          },
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
