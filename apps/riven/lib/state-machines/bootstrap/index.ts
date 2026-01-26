import { type AnyActorRef, assign, setup } from "xstate";
import z from "zod";

import {
  type PluginRegistrarMachineOutput,
  pluginRegistrarMachine,
} from "../plugin-registrar/index.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { initialiseDatabaseConnection } from "./actors/initialise-database-connection.actor.ts";
import { initialiseVfs } from "./actors/initialise-vfs.actor.ts";
import { startGqlServer } from "./actors/start-gql-server.actor.ts";

import type {
  InvalidPlugin,
  RegisteredPlugin,
  ValidPlugin,
} from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { ApolloServer } from "@apollo/server";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type Fuse from "@zkochan/fuse-native";
import type { Queue, Worker } from "bullmq";

export interface BootstrapMachineContext {
  error?: Error;
  rootRef: AnyActorRef;
  validatingPlugins: Map<symbol, RegisteredPlugin>;
  validPlugins: Map<symbol, ValidPlugin>;
  invalidPlugins: Map<symbol, InvalidPlugin>;
  server?: ApolloServer;
  vfs?: Fuse;
  pluginQueues: Map<symbol, Map<RivenEvent["type"], Queue>>;
  pluginWorkers: Map<symbol, Map<RivenEvent["type"], Worker>>;
  publishableEvents: Set<RivenEvent["type"]>;
}

export interface BootstrapMachineInput {
  rootRef: AnyActorRef;
}

export interface BootstrapMachineOutput {
  server: ApolloServer;
  plugins: Map<symbol, ValidPlugin>;
  pluginQueues: Map<symbol, Map<RivenEvent["type"], Queue>>;
  pluginWorkers: Map<symbol, Map<RivenEvent["type"], Worker>>;
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
    /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7AxAZQBUBBZAgbQAYBdRUABwHtZUAXVBrWkAD0QBYATABoQAT0QCAnAEYAdAL6TJfAKwU1kgMwAOFSoC++kWky4AogA0AkuWpdGzNhy68EgkeITTNFWYqUA7BQBmgF8fNrSfIbGGNg4AGJExAAyAPpmyMgA8siUNEggDqzsnIWu7mKI3poCsioAbAoB0tIUut4xICbYslZYJQCGADaozFhQOBAcYLKwLIMssz1YfQNsI2OoE-n2TCXO5dUhDbKaDUF8bRTSKjLSHoja4bIUTRHBAQ0qOl0ra0NRuMoLIAEIMBgseYAJ0GdAABBBFoMAEaDWBgeEAYw4WDAWKcqzwC2hbAmUxmsm26AYAGtZttAWMwAARZFojEAYVx+MJu0KxUJLkQDQoklk2gEkT4XxkfHUmkeXgoUle7zUigEAju2j+cVW-SZwLBEKhLFhCKRCw5mJxWDxBNKsmJg1J20mYGh0IY0NkdGGiwAZj6ALZU9aoTYYtnW9Fgbn23mlfn0fZCo5eE5nC4UK4UG53VpK1pqM6aFTaFp8TRRAQBAR60wAjZA90myEwuHwgDiFoAFgBFFLwvCezC+l1u8nTPHhmn0uYkljdgCOw1H0PHKaKadKwoQP208gE30C0jCkjFSoumj8by1lY1kgujd6hpbWwm7bNFp7-aHI5jp6zpLu6OCet6vr+kGoaLq6y5rhuW52AKu6HKArjnuc2aXNctz3Eq2gyPU6oNM8bxEZor4GhGUZtuCHbml2-oAK5QNssCyMgYDsfMnpgTODJYPOszQjxYxLNCAAKwxsRx26CnuGYqFc8hqCqYTVie6hKpoz71NomhGZoqgBNoFzREY3T6s2katl+DE-sxsnsVgnEAGqbFaAmUtSdKzAA7oMrAJD6nmjBAMlyW5CloWUGHVNIJ6vHp+bPA0DQ6N4Soyr4kg-A+TTBIZDZWf8752Z+IKOZ2CKsa5HleYsPmzn5C5BSFYVeVFDVkNIBSpo4SkJV4SWnBQqXtHwGVZYqVQIKEASyEoSgZVE55ig01HOn2LEsNMAW4IJc7+YuDB0Ku65AdCsVDehPD8HcfhRCqoRJRErR8MWNbLSt5lSutMoGF0WAMBAcBcCsex3fFD0IAAtA0SqI9tVgQMMYDQwcsMVMI83eFoaoKFqUoBGTz6o7R9lQFj6Yja0S2SpEDTKCZ5y5kj80CCqv1KDWrRaio0jKJTRr0aatWIuycbYjyjr3Yp92Yd8EoAyz1bVqK01KjIKgSu9ZHaO0DTeFtZU2RVdEORLTGWtLGKy4m8tEqBEy08NcMCN4qvM6zmsc8WNx1DKMjs+WUrqKLH7GjVttS7GDt2g6hKyNyIb+mASzu0rTySIzEeadqSiBxNZzvT45bqM0UeVTHNu-r2cKDsOSGetnOPVCrTPSOrbNa5zngVnrl5NBc3O6LoZuxE2lvU9+kuN3QzeAZuwGTmSNOoTD+5e7e3e9-72vzSzvjhCe2iVmTM2ldPb5U1V89x4vy+t76acZ1nW-Y-uIRLWRXwTWlF8AIKhryGVkKKLQ8pRQqE0pZW+NExbW0Yr+eqHF277h7nrfeft2ZH08FIU+K0Iij0kEbMmNcrbVXrs5aKnFuK8Uku6DBGZd4+x7rg-uulIgSjFDISsXswi6GBgg2yVDH6oJchxWQ4VUDeTdl-OmcMwh1C9pWW47MVIPHmllXhgRprKEaJleB1kZ73zrig2hDVU4MHThjT+g1v4ZluG0ZaqgkrEyuCZbQulLx+C+IWLQ3M9I31Mb0ZALF7TMMUR7TCUC-CSHHhWQyzxQHzSNqcRoCg1CRC0BlSQ20zBeh9JAFhI1uYCFvBNJKtQrieLmp4T6R4smCBMjISpoT-h4F2vtBgh0ylw28EeTU54giVnytIcyhE5DqRuCAqI9YL6dJsmYbgrBSkxJzggb4S1vB1nUFoEBXw8aeEJgoM85YQgykMIYIAA */
    id: "Bootstrap",
    initial: "Initialising",
    context: ({ input }) => ({
      rootRef: input.rootRef,
      validatingPlugins: new Map(),
      validPlugins: new Map(),
      invalidPlugins: new Map(),
      pluginQueues: new Map(),
      pluginWorkers: new Map(),
      publishableEvents: new Set(),
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
      Initialising: {
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
          "Bootstrapping plugins": {
            initial: "Registering",
            states: {
              Registering: {
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
                  input: ({ context: { rootRef } }) => ({
                    rootRef,
                  }),
                  onDone: [
                    {
                      target: "Complete",
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
                      target: "Complete",
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
              Complete: {
                entry: [
                  {
                    type: "log",
                    params: {
                      message: "Plugin bootstrap complete.",
                    },
                  },
                ],
                type: "final",
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
                mountPath: z
                  .string()
                  .parse(process.env["RIVEN_VFS_MOUNT_PATH"]),
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
