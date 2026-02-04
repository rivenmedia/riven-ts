import { type AnyActorRef, assign, setup } from "xstate";

import { settings } from "../../utilities/settings.ts";
import {
  type PluginRegistrarMachineOutput,
  pluginRegistrarMachine,
} from "../plugin-registrar/index.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
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
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";
import type Fuse from "@zkochan/fuse-native";

export interface BootstrapMachineContext {
  error?: Error;
  rootRef: AnyActorRef;
  validatingPlugins: RegisteredPluginMap;
  validPlugins: ValidPluginMap;
  invalidPlugins: InvalidPluginMap;
  server?: ApolloServer;
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
  server: ApolloServer;
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
    assignGqlServer: assign((_, server: ApolloServer) => ({
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
    startGqlServer,
    initialiseDatabaseConnection,
    pluginRegistrarMachine,
    initialiseVfs,
  },
  guards: {
    hasInvalidPlugins: ({ context: { invalidPlugins } }) =>
      invalidPlugins.size > 0,
  },
})
  .extend(withLogAction)
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCED2qAusMCcCGADgHRqbb4EECWAdlAAQEA2ArlLbEQEpjvZg5aUAMQRUNMEVoA3VAGtJzNrR59ceHAFk8AYwAWtMAG0ADAF1EoAqlhUMVcZZAAPRAFYAjAHYiATgBsJgBMJr4hYb4ALP4ANCAAnohB-j7Rbv6RHgDM6ZG+Jh4AvoVxpFjqxGXkhNR0jKzsNJyqVPyCdKLikjLyig0qvK3qWroGEkYeFkgg1rb2jtOuCJ4+AcGh4UFRsQmIHm4mRFlBAByBWVkmJv5BQW7FpejlFEQAkjR2VHhMrUL0sAJpFQdHBOhIiNg8BhJFUKm8PvZvr86gCcECQbBTFMrDZPgtQEsPB4CkQDl4vPs3PkMrc4okEClDidiSZ0mFIhSskUSiBYS93p8kbYUYDgXASE9qpQ-hAoXgAEZ4AH0HTiCQ6eY0IgAZQwGnsHTE4J6CikCK+PwBABE5YqAQBhNVgDUOGhYpyzPE0JxLNwnSJELyRaJZclZaIUoJ0xC+Dz+IiRA5BSInIJeE6hrIPXmSuECxGWv6o9Hivk1GW2pVgFVOl3iHV6nAGkQCHCoHBEZhQgBm7YAtmbBZawDa9XawI6aOrNe7pp7NT6Y15owgPCdfFlA-tImmPKdgl5-Nmy8R8xbkQxi2LOCfagwAOIUPQARQAMvRtYCBA39UIwd0aFkU1ISbe8AEcmE-NEBFnHE5ldRcGS8TcPA3LYLjyTx-RXdIgj8LkLn8KIOX9blHjIPNzSFItRQxCUKIoO96EfQgX3fKDpG-XVfw6Vt207Jge37CFGwwcDIK-HBYJmXEF0WPZiQ8UkTHJSlqR3KNdgQCl418PSTgzEwDP8VCTmPXMXlvP4ADUADFtX-ESoRhCzCHo55yzqOztWk+cEPk1dFOU1S3Cpa4NJXfYsl8I4DM8LlfDcQ9-CzHkT3cqUmO8n8mz-I0AKAgCh1aMBrO7TFzA9WT-IJRAbjwzw0giDkvGTSLEwDDMCJCdcgxU8yGLcqyvPsnLm2EPiOy7DBexwAdaGKgEyoq7EZPg-EXAUkkyQpUL1NpLT9hONxSXTLJ1xUoI42KHkaFQCA4CcE8qvW70AuSFcAFogk3PS-v+-6koGjzKlc6U6iURp4DnaqNqWIMVxSog40iS44wOLk938I80rBjKKiYyGOG4QY2iEF6vUQvdNPpH7Ny8XwKXTK5IgKfwTi8YGpXxxi-iJpoiEdPtmDAaEKbk2qEDCeNkgCRL0muM4ThXZI8KiKkViMvc3CCLnKMWmi0WvcWas2qW8PTYNTh1txQ2xldzpOIhAjTQjgzja7ccG08qMLEUjbo4aGFlMcqxrKdnQltbKYCjxWcDf0d2Ou47Z2ekThMTdFZ3MJjkTdI9f5X2L3+WjSzBpiQ4VMPVQjustW43K6BNuG9gMhOreT23kpXC7neS5lolItxIkLtyz2o-2SxvCuK1D5Va+nV1BdQYWmFFsAW7eyWOaUkJkKuYlHdjXv8iIH7XaM1Nkt8MefYNqfrx5zyHyfN8P0krfELRohM5MgoCiZDOCuDkJ1DxeEzjrYirUzh33hA-S8ZcZ7eyYixAgbEP7QQ7I3ZsX8Arhhin-RSgC1xp3cOmPwgRjqsm1hmHG5EQbwILCXK8gdZ51DQRgji34hYizFjDV6iFd7nxUpcABx8PA4VasjDmO5yQj2ZEROBQd6DeTwZLLYeEQwpFuNFVCgQyGriyEjY6h5MihUzjA5R7CGDZRweTARMdJbhkONo1qP1YxrEMXHJKgZErRUuEGHIqUGHcxUdlXh69+FwScWbBmMVQEhl8P6LYRJ2qeF-ldKIxwrjs1Hl7Rh2oWA6AxNDGJUdCSXCdmuDq7NjgZHTJFW28Y8gH2ZKEHI+w4EAFEcBthwJAdRZtshGRkbUjMyQSKRQ5jFZkttkxxnONjG6hQgA */
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
                      .map((k) => k.description)
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
        onDone: "Bootstrapping VFS",
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
                        params: ({ event }) => ({
                          message: `Failed to initialise database connection during bootstrap. Error: ${(event.error as Error).message}`,
                          level: "error",
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
                        params: ({ event }) => ({
                          message: `Failed to start GraphQL server during bootstrap. Error: ${(event.error as Error).message}`,
                          level: "error",
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
                actions: [
                  {
                    type: "log",
                    params: ({ event }) => ({
                      message: `Failed to initialise VFS during bootstrap. Error: ${(event.error as Error).message}`,
                      level: "error",
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
