import { logger } from "@repo/core-util-logger";
import { DataSourceMap, type RivenPlugin } from "@repo/util-plugin-sdk";

import type { FetcherRequestInit } from "@apollo/utils.fetcher";
import {
  type AnyActorRef,
  type MachineContext,
  assign,
  createActor,
  setup,
  toPromise,
  waitFor,
} from "xstate";

import { redisCache } from "../../utils/redis-cache.ts";
import { rateLimiterMachine } from "../rate-limiter/index.ts";
import {
  type InvalidPlugin,
  type PendingRunnerInvocationPlugin,
  type RegisteredPlugin,
  collectPluginsForRegistration,
} from "./actors/collect-plugins-for-registration.actor.ts";
import { validatePlugin } from "./actors/validate-plugin.actor.ts";

export interface PluginRegistrarMachineContext extends MachineContext {
  rootRef: AnyActorRef;
  parsedPlugins?: RivenPlugin[];
  runningValidators: Map<symbol, AnyActorRef>;
  pendingPlugins: Map<symbol, RegisteredPlugin>;
  invalidPlugins: Map<symbol, InvalidPlugin>;
  validPlugins: Map<symbol, PendingRunnerInvocationPlugin>;
}

export interface PluginRegistrarMachineInput {
  rootRef: AnyActorRef;
}

export interface PluginRegistrarMachineOutput {
  validPlugins: Map<symbol, PendingRunnerInvocationPlugin>;
  invalidPlugins: Map<symbol, InvalidPlugin>;
}

export type PluginRegistrarMachineEvent =
  | { type: "riven.plugin-valid"; plugin: PendingRunnerInvocationPlugin }
  | { type: "riven.plugin-invalid"; plugin: InvalidPlugin };

export const pluginRegistrarMachine = setup({
  types: {
    context: {} as PluginRegistrarMachineContext,
    input: {} as PluginRegistrarMachineInput,
    events: {} as PluginRegistrarMachineEvent,
    children: {} as {
      rateLimiterMachine: "rateLimiterMachine";
      collectPluginsForRegistration: "collectPluginsForRegistration";
      validatePlugin: "validatePlugin";
    },
    output: {} as PluginRegistrarMachineOutput,
  },
  actions: {
    registerPlugins: assign({
      pendingPlugins: ({ context }, plugins: RivenPlugin[]) => {
        const pluginMap = new Map<symbol, RegisteredPlugin>();

        for (const plugin of plugins) {
          const dataSources = new DataSourceMap();

          if (plugin.dataSources) {
            for (const DataSource of plugin.dataSources) {
              try {
                const rateLimiterRef = createActor(rateLimiterMachine, {
                  parent: context.rootRef,
                  input: {
                    limiterOptions: DataSource.rateLimiterOptions ?? null,
                  },
                }).start();

                const token = DataSource.getApiToken();
                const instance = new DataSource({
                  cache: redisCache,
                  token,
                  fetch: async (
                    url: string,
                    options: FetcherRequestInit | undefined,
                  ) => {
                    const requestId = crypto.randomUUID();

                    rateLimiterRef.send({
                      type: "fetch-requested",
                      url,
                      fetchOpts: options,
                      requestId,
                    });

                    try {
                      await waitFor(
                        rateLimiterRef,
                        (state) => state.context.requestQueue.has(requestId),
                        { timeout: 10000 },
                      );
                    } catch (error) {
                      throw new Error(
                        `Timeout waiting for rate limiter to register fetch request ${requestId} for data source ${DataSource.name} in plugin ${plugin.name.toString()}: ${
                          (error as Error).message
                        }`,
                      );
                    }

                    const actor = rateLimiterRef
                      .getSnapshot()
                      .context.requestQueue.get(requestId);

                    if (!actor) {
                      throw new Error(
                        `Failed to get fetch actor for request ID ${requestId}`,
                      );
                    }

                    actor.send({ type: "fetch" });

                    return toPromise(actor);
                  },
                  logger,
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
      ({ context }, validPlugin: PendingRunnerInvocationPlugin) => {
        const existingPendingItem = context.pendingPlugins.get(
          validPlugin.config.name,
        );

        if (!existingPendingItem) {
          logger.error(
            `Received valid plugin notification for unknown plugin: ${validPlugin.config.name.toString()}`,
          );

          return;
        }

        const newPendingPlugins = new Map(context.pendingPlugins);

        newPendingPlugins.delete(validPlugin.config.name);

        return {
          pendingPlugins: newPendingPlugins,
          validPlugins: context.validPlugins.set(
            validPlugin.config.name,
            validPlugin,
          ),
        };
      },
    ),
    handleInvalidPlugin: assign(({ context }, invalidPlugin: InvalidPlugin) => {
      const existingPendingItem = context.pendingPlugins.get(
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

      const newPendingPlugins = new Map(context.pendingPlugins);

      newPendingPlugins.delete(invalidPlugin.config.name);

      return {
        pendingPlugins: newPendingPlugins,
        invalidPlugins: context.invalidPlugins.set(
          invalidPlugin.config.name,
          invalidPlugin,
        ),
      };
    }),
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
  },
  actors: {
    collectPluginsForRegistration,
    rateLimiterMachine,
    validatePlugin,
  },
  guards: {
    allPluginsValidated: ({ context }) => context.pendingPlugins.size === 0,
    isPluginValid: (_, isValid: boolean) => isValid,
  },
}).createMachine({
  context: ({ input }) => ({
    pendingPlugins: new Map(),
    invalidPlugins: new Map(),
    validPlugins: new Map(),
    runningValidators: new Map(),
    rootRef: input.rootRef,
  }),
  id: "Plugin registrar",
  initial: "Registering plugins",
  output: ({ context }) => ({
    validPlugins: context.validPlugins,
    invalidPlugins: context.invalidPlugins,
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
              parsedPlugins: ({ event }) => event.output,
            }),
            {
              type: "registerPlugins",
              params: ({ event }) => event.output,
            },
          ],
        },
      },
    },
    Validating: {
      entry: "spawnValidators",
      always: {
        guard: "allPluginsValidated",
        target: "Validated",
      },
      on: {
        "riven.plugin-valid": {
          actions: [
            {
              type: "handleValidPlugin",
              params: ({ event }) => event.plugin,
            },
          ],
        },
        "riven.plugin-invalid": {
          actions: {
            type: "handleInvalidPlugin",
            params: ({ event }) => event.plugin,
          },
        },
      },
    },
    Validated: {
      type: "final",
    },
  },
});
