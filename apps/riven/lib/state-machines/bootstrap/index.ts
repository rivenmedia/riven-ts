import { type AnyActorRef, assign, setup } from "xstate";

import {
  type InvalidPlugin,
  type PendingRunnerInvocationPlugin,
  type RegisteredPlugin,
} from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import {
  type PluginRegistrarMachineOutput,
  pluginRegistrarMachine,
} from "../plugin-registrar/index.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { initialiseDatabaseConnection } from "./actors/initialise-database-connection.actor.ts";
import { initialiseQueues } from "./actors/initialise-queues.actor.ts";
import { initialiseVFS } from "./actors/initialise-vfs.actor.ts";
import { startGqlServer } from "./actors/start-gql-server.actor.ts";

import type { ApolloServer } from "@apollo/server";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { Queue } from "bullmq";

export interface BootstrapMachineContext {
  error?: Error;
  rootRef: AnyActorRef;
  validatingPlugins: Map<symbol, RegisteredPlugin>;
  validPlugins: Map<symbol, PendingRunnerInvocationPlugin>;
  invalidPlugins: Map<symbol, InvalidPlugin>;
  server?: ApolloServer;
  queues: Map<RivenEvent["type"], Queue>;
}

export interface BootstrapMachineInput {
  rootRef: AnyActorRef;
}

export interface BootstrapMachineOutput {
  server: ApolloServer;
  plugins: Map<symbol, PendingRunnerInvocationPlugin>;
  queues: Map<RivenEvent["type"], Queue>;
}

export const bootstrapMachine = setup({
  types: {
    context: {} as BootstrapMachineContext,
    input: {} as BootstrapMachineInput,
    output: {} as BootstrapMachineOutput,
    children: {} as {
      startGqlServer: "startGqlServer";
      initialiseDatabaseConnection: "initialiseDatabaseConnection";
      initialiseVFS: "initialiseVFS";
      pluginRegistrarMachine: "pluginRegistrarMachine";
      initialiseQueues: "initialiseQueues";
    },
  },
  actions: {
    assignGqlServer: assign((_, server: ApolloServer) => ({
      server,
    })),
    assignQueues: assign((_, queues: Map<RivenEvent["type"], Queue>) => ({
      queues,
    })),
    raiseError: (_, error: Error) => {
      throw error;
    },
    handlePluginValidationResponse: assign({
      validatingPlugins: () => new Map(),
      invalidPlugins: (_, { invalidPlugins }: PluginRegistrarMachineOutput) =>
        invalidPlugins,
      validPlugins: (_, { validPlugins }: PluginRegistrarMachineOutput) => {
        const pluginMap = new Map<symbol, PendingRunnerInvocationPlugin>();

        for (const [
          pluginSymbol,
          { config, dataSources },
        ] of validPlugins.entries()) {
          pluginMap.set(pluginSymbol, {
            status: "pending-runner-invocation",
            config,
            dataSources,
          });
        }

        return pluginMap;
      },
    }),
  },
  actors: {
    startGqlServer,
    initialiseDatabaseConnection,
    initialiseVFS,
    pluginRegistrarMachine,
    initialiseQueues,
  },
  guards: {
    hasInvalidPlugins: ({ context }) => context.invalidPlugins.size > 0,
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
      queues: new Map(),
    }),
    output: ({ context }) => {
      if (!context.server) {
        throw new Error(
          "Bootstrap machine completed without a GraphQL server instance",
        );
      }

      return {
        plugins: context.validPlugins,
        server: context.server,
        queues: context.queues,
      };
    },
    states: {
      Initialising: {
        type: "parallel",
        states: {
          "Bootstrap database connection": {
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
          "Bootstrap VFS": {
            initial: "Starting",
            states: {
              Starting: {
                entry: {
                  type: "log",
                  params: {
                    message: "Initialising VFS...",
                  },
                },
                invoke: {
                  id: "initialiseVFS",
                  src: "initialiseVFS",
                  onDone: "Complete",
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
          "Bootstrap GraphQL Server": {
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
                        params: ({ event }) => event.output.server,
                      },
                      {
                        type: "log",
                        params: ({ event }) => ({
                          message: `GraphQL server ready at ${event.output.url}`,
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
          "Bootstrap plugins": {
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
                  input: ({ context }) => ({
                    rootRef: context.rootRef,
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
                          params: ({ event }) => event.output,
                        },
                      ],
                    },
                    {
                      target: "Complete",
                      actions: [
                        {
                          type: "log",
                          params: ({ event }) => ({
                            message: `Plugins registered successfully. ${[
                              ...event.output.validPlugins.keys(),
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
          "Bootstrap queues": {
            initial: "Initialising",
            states: {
              Initialising: {
                entry: {
                  type: "log",
                  params: {
                    message: "Starting queue initialisation...",
                  },
                },
                invoke: {
                  id: "initialiseQueues",
                  src: "initialiseQueues",
                  onDone: {
                    target: "Complete",
                    actions: {
                      type: "assignQueues",
                      params: ({ event }) => event.output,
                    },
                  },
                },
              },
              Complete: {
                type: "final",
                entry: {
                  type: "log",
                  params: {
                    message: "Queue initialisation complete.",
                  },
                },
              },
            },
          },
        },
        onDone: "Success",
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
