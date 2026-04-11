import chalk from "chalk";
import { type AnyActorRef, assign, setup } from "xstate";

import { settings } from "../../utilities/settings.ts";
import {
  type PluginRegistrarMachineOutput,
  pluginRegistrarMachine,
} from "../plugin-registrar/index.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { clearPreviousInstanceState } from "./actors/clear-previous-instance-state.actor.ts";
import { initialiseDatabaseConnection } from "./actors/initialise-database-connection.actor.ts";
import { initialiseVfs } from "./actors/initialise-vfs.actor.ts";
import { startGqlServer } from "./actors/start-gql-server.actor.ts";

import type {
  InvalidPluginMap,
  PluginQueueMap,
  PluginWorkerMap,
  RegisteredPluginMap,
  ValidPlugin,
  ValidPluginMap,
} from "../../types/plugins.ts";
import type { ApolloServer } from "@apollo/server";
import type { ApolloServerContext } from "@repo/core-util-graphql-schema";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";
import type Fuse from "@zkochan/fuse-native";

export interface BootstrapMachineContext {
  error?: Error;
  rootRef: AnyActorRef;
  validatingPlugins: RegisteredPluginMap;
  validPlugins: ValidPluginMap;
  invalidPlugins: InvalidPluginMap;
  server?: ApolloServer<ApolloServerContext>;
  vfs?: Fuse;
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
  publishableEvents: Set<RivenEvent["type"]>;
  pluginSettings: PluginSettings | null;
}

export interface BootstrapMachineInput {
  rootRef: AnyActorRef;
}

export interface BootstrapMachineOutput {
  server: ApolloServer<ApolloServerContext>;
  plugins: ValidPluginMap;
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
  publishableEvents: Set<RivenEvent["type"]>;
  vfs: Fuse;
}

export const bootstrapMachine = setup({
  types: {
    context: {} as BootstrapMachineContext,
    input: {} as BootstrapMachineInput,
    output: {} as BootstrapMachineOutput,
    children: {} as {
      startGqlServer: "startGqlServer";
      initialiseDatabaseConnection: "initialiseDatabaseConnection";
      pluginRegistrarMachine: "pluginRegistrarMachine";
      initialiseVfs: "initialiseVfs";
    },
  },
  actions: {
    assignGqlServer: assign((_, server: ApolloServer<ApolloServerContext>) => ({
      server,
    })),
    assignVfs: assign((_, vfs: Fuse) => ({
      vfs,
    })),
    raiseError: (_, error: Error) => {
      throw error;
    },
    handlePluginValidationResponse: assign({
      validatingPlugins: () => new Map(),
      invalidPlugins: (_, { invalidPlugins }: PluginRegistrarMachineOutput) =>
        invalidPlugins,
      validPlugins: (_, { validPlugins }) => {
        const pluginMap = new Map<symbol, ValidPlugin>();

        for (const [
          pluginSymbol,
          { config, dataSources },
        ] of validPlugins.entries()) {
          pluginMap.set(pluginSymbol, {
            status: "valid",
            config,
            dataSources,
          });
        }

        return pluginMap;
      },
      pluginQueues: (_, { pluginQueues }) => pluginQueues,
      pluginWorkers: (_, { pluginWorkers }) => pluginWorkers,
      publishableEvents: (_, { publishableEvents }) => publishableEvents,
      pluginSettings: (_, { settings }) => settings,
    }),
  },
  actors: {
    clearPreviousInstanceState,
    initialiseDatabaseConnection,
    initialiseVfs,
    pluginRegistrarMachine,
    startGqlServer,
  },
  guards: {
    hasInvalidPlugins: ({ context: { invalidPlugins } }) =>
      invalidPlugins.size > 0,
  },
})
  .extend(withLogAction)
  .createMachine({
    id: "Bootstrap",
    initial: "Bootstrapping plugins",
    context: ({ input }) => ({
      rootRef: input.rootRef,
      validatingPlugins: new Map(),
      validPlugins: new Map(),
      invalidPlugins: new Map(),
      pluginQueues: new Map(),
      pluginWorkers: new Map(),
      publishableEvents: new Set(),
      pluginSettings: null,
    }),
    output: ({
      context: {
        server,
        vfs,
        validPlugins,
        pluginQueues,
        pluginWorkers,
        publishableEvents,
      },
    }) => {
      if (!server) {
        throw new Error(
          "Bootstrap machine completed without a GraphQL server instance",
        );
      }

      if (!vfs) {
        throw new Error("Bootstrap machine completed without a VFS instance");
      }

      return {
        plugins: validPlugins,
        server,
        vfs,
        pluginQueues,
        pluginWorkers,
        publishableEvents,
      };
    },
    states: {
      "Bootstrapping plugins": {
        entry: [
          {
            type: "log",
            params: {
              message: "Starting plugin registration...",
            },
          },
        ],
        invoke: {
          id: "pluginRegistrarMachine",
          src: "pluginRegistrarMachine",
          input: ({ context: { rootRef } }) => ({ rootRef }),
          onDone: [
            {
              target: "Initialising services",
              guard: "hasInvalidPlugins",
              actions: [
                {
                  type: "log",
                  params: {
                    message:
                      "One or more plugins failed to validate. Riven will start, but some functionality may be limited. Check the logs for more details.",
                    level: "warn",
                  },
                },
                {
                  type: "handlePluginValidationResponse",
                  params: ({ event: { output } }) => output,
                },
              ],
            },
            {
              target: "Initialising services",
              actions: [
                {
                  type: "log",
                  params: ({
                    event: {
                      output: { validPlugins },
                    },
                  }) => ({
                    message: `Plugins registered successfully. ${[
                      ...validPlugins.keys(),
                    ]
                      .map((k) => chalk.bold(k.description))
                      .join(", ")}.`,
                  }),
                },
                {
                  type: "handlePluginValidationResponse",
                  params: ({ event }) => event.output,
                },
              ],
            },
          ],
        },
      },
      "Initialising services": {
        type: "parallel",
        onDone: "Clearing previous instance state",
        states: {
          "Bootstrapping database connection": {
            initial: "Starting",
            states: {
              Starting: {
                entry: {
                  type: "log",
                  params: {
                    message: "Initialising database connection...",
                  },
                },
                invoke: {
                  id: "initialiseDatabaseConnection",
                  src: "initialiseDatabaseConnection",
                  onDone: "Complete",
                  onError: {
                    target: "#Bootstrap.Errored",
                    actions: [
                      {
                        type: "log",
                        params: ({ event: { error } }) => ({
                          message:
                            "Failed to initialise database connection during bootstrap.",
                          level: "error",
                          error,
                        }),
                      },
                      {
                        type: "raiseError",
                        params: ({ event }) => event.error as Error,
                      },
                    ],
                  },
                },
              },
              Complete: {
                entry: {
                  type: "log",
                  params: {
                    message: "Database connection bootstrap complete.",
                  },
                },
                type: "final",
              },
            },
          },
          "Bootstrapping GraphQL Server": {
            initial: "Starting",
            states: {
              Starting: {
                entry: {
                  type: "log",
                  params: {
                    message: "Starting GraphQL server...",
                  },
                },
                invoke: {
                  id: "startGqlServer",
                  src: "startGqlServer",
                  input: ({ context: { validPlugins, pluginSettings } }) => {
                    if (!pluginSettings) {
                      throw new Error(
                        "Plugin settings not available when starting GraphQL server. Ensure the plugin registrar has been run first.",
                      );
                    }

                    return {
                      validPlugins,
                      pluginSettings,
                    };
                  },
                  onDone: {
                    target: "Complete",
                    actions: [
                      {
                        type: "assignGqlServer",
                        params: ({
                          event: {
                            output: { server },
                          },
                        }) => server,
                      },
                      {
                        type: "log",
                        params: ({
                          event: {
                            output: { url },
                          },
                        }) => ({
                          message: `GraphQL server ready at ${url}`,
                        }),
                      },
                    ],
                  },
                  onError: {
                    target: "#Bootstrap.Errored",
                    actions: [
                      {
                        type: "log",
                        params: ({ event: { error } }) => ({
                          message:
                            "Failed to start GraphQL server during bootstrap.",
                          level: "error",
                          error,
                        }),
                      },
                      {
                        type: "raiseError",
                        params: ({ event }) => event.error as Error,
                      },
                    ],
                  },
                },
              },
              Complete: {
                type: "final",
                entry: {
                  type: "log",
                  params: {
                    message: "GraphQL bootstrap complete.",
                  },
                },
              },
            },
          },
        },
      },
      "Clearing previous instance state": {
        invoke: {
          id: "clearPreviousInstanceState",
          src: "clearPreviousInstanceState",
          input: () => ({
            wipeDatabase: settings.unsafeWipeDatabaseOnStartup,
            wipeRedis: settings.unsafeWipeRedisOnStartup,
          }),
          onDone: "Bootstrapping VFS",
          onError: "Errored",
        },
      },
      "Bootstrapping VFS": {
        initial: "Starting",
        onDone: "Success",
        states: {
          Starting: {
            entry: {
              type: "log",
              params: {
                message: "Initialising VFS...",
              },
            },
            invoke: {
              id: "initialiseVfs",
              src: "initialiseVfs",
              input: ({ context: { pluginQueues } }) => ({
                mountPath: settings.vfsMountPath,
                pluginQueues,
              }),
              onDone: {
                target: "Complete",
                actions: {
                  type: "assignVfs",
                  params: ({
                    event: {
                      output: { vfs },
                    },
                  }) => vfs,
                },
              },
              onError: {
                target: "#Bootstrap.Errored",
                actions: {
                  type: "raiseError",
                  params: ({ event }) => event.error as Error,
                },
              },
            },
          },
          Complete: {
            entry: {
              type: "log",
              params: {
                message: "VFS bootstrap complete.",
              },
            },
            type: "final",
          },
        },
      },
      Success: {
        type: "final",
      },
      Errored: {
        type: "final",
        entry: {
          type: "log",
          params: {
            message: "A fatal error occurred during bootstrap.",
            level: "error",
          },
        },
      },
    },
  });
