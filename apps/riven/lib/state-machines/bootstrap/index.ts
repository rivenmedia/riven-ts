import { type LogLevel, logger } from "@repo/core-util-logger";
import {
  DataSourceMap,
  type ProgramToPluginEvent,
} from "@repo/util-plugin-sdk";

import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import type { ApolloServer } from "@apollo/server";
import type { FetcherRequestInit } from "@apollo/utils.fetcher";
import type { KeyvAdapter } from "@apollo/utils.keyvadapter";
import type { UUID } from "node:crypto";
import { assign, emit, setup, toPromise, waitFor } from "xstate";

import { rateLimiterMachine } from "../rate-limiter/index.js";
import { initialiseDatabaseConnection } from "./actors/initialise-database-connection.actor.ts";
import {
  type RegisteredPlugin,
  registerPlugins,
} from "./actors/register-plugins.actor.ts";
import { startGqlServer } from "./actors/start-gql-server.actor.ts";
import { stopGqlServer } from "./actors/stop-gql-server.actor.ts";
import { waitForValidPlugins } from "./actors/wait-for-valid-plugins.actor.ts";

export interface BootstrapMachineContext {
  cache: KeyvAdapter;
  client: ApolloClient;
  plugins: Map<symbol, RegisteredPlugin>;
  sessionId: UUID;
  server: ApolloServer | null;
}

export interface BootstrapMachineInput {
  cache: KeyvAdapter;
  sessionId: UUID;
}

export type BootstrapMachineEvent =
  | ProgramToPluginEvent
  | { type: "START" }
  | { type: "FATAL_ERROR" }
  | { type: "EXIT" };

export const bootstrapMachine = setup({
  types: {
    context: {} as BootstrapMachineContext,
    emitted: {} as ProgramToPluginEvent,
    events: {} as BootstrapMachineEvent,
    children: {} as {
      registerPlugins: "registerPlugins";
      waitForValidPlugins: "waitForValidPlugins";
      startGqlServer: "startGqlServer";
      stopGqlServer: "stopGqlServer";
      initialiseDatabaseConnection: "initialiseDatabaseConnection";
    },
    input: {} as BootstrapMachineInput,
  },
  actions: {
    broadcastToPlugins: ({ context }, event: ProgramToPluginEvent) => {
      for (const { ref } of context.plugins.values()) {
        ref.send(event);
      }
    },
    log: (
      _,
      {
        message,
        level = "info",
      }: {
        message: string;
        level?: LogLevel;
      },
    ) => {
      logger[level](message);
    },
  },
  actors: {
    registerPlugins,
    waitForValidPlugins,
    startGqlServer,
    stopGqlServer,
    initialiseDatabaseConnection,
  },
  guards: {
    hasInvalidPlugins: ({ context }) => {
      for (const { ref } of context.plugins.values()) {
        if (ref.getSnapshot().matches("Errored")) {
          return true;
        }
      }

      return false;
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7AxAZQBUBBZAgbQAYBdRUABwHtZUAXVBrWkAD0QBYATABoQAT0QCAnAEYAdAL6TJfAKwU1kgMwAOFSoC++kWky4AogA0AkuWpdGzNhy68EgkeITTNFWYqUA7BQBmgF8fNrSfIbGGNg4AGJExAAyAPpmyMgA8siUNEggDqzsnIWu7mKI3poCsioAbAoB0tIUut4xICbYslZYJQCGADaozFhQOBAcYLKwLIMssz1YfQNsI2OoE-n2TCXO5dUhDbKaDUF8bRTSKjLSHoja4bIUTRHBAQ0qOl0ra0NRuMoLIAEIMBgseYAJ0GdAABBBFoMAEaDWBgeEAYw4WDAWKcqzwC2hbAmUxmsm26AYAGtZttAWMwAARZFojEAYVx+MJu0KxUJLkQDQoklk2gEkT4XxkfHUmkeXgoUle7zUigEAju2j+cVW-SZwLBEKhLFhCKRCw5mJxWDxBNKsmJg1J20mYGh0IY0NkdGGiwAZj6ALZU9aoTYYtnW9Fgbn23mlfn0fZCo5eE5nC4UK4UG53VpK1pqM6aFTaFp8TRRAQBAR60wAjZA90myEwuHwgDiFoAFgBFFLwvCezC+l1u8nTPHhmn0uYkljdgCOw1H0PHKaKadKwoQP208gE30C0jCkjFSoumj8by1lY1kgujd6hpbWwm7bNFp7-aHI5jp6zpLu6OCet6vr+kGoaLq6y5rhuW52AKu6HKArjnuc2aXNctz3Eq2gyPU6oNM8bxEZor4GhGUZtuCHbml2-oAK5QNssCyMgYDsfMnpgTODJYPOszQjxYxLNCAAKwxsRx26CnuGYqFc8hqCqYTVie6hKpoz71NomhGZoqgBNoFzREY3T6s2katl+DE-sxsnsVgnEAGqbFaAmUtSdKzAA7oMrAJD6nmjBAMlyW5CloWUGHVNIJ6vHp+bPA0DQ6N4Soyr4kg-A+TTBIZDZWf8752Z+IKOZ2CKsa5HleYsPmzn5C5BSFYVeVFDVkNIBSpo4SkJV4SWnBQqXtHwGVZYqVQIKEASyEoSgZVE55ig01HOn2LEsNMAW4IJc7+YuDB0Ku65AdCsVDehPD8HcfhRCqoRJRErR8MWNbLSt5lSutMoGF0WAMBAcBcCsex3fFD0IAAtA0SqI9tVgQMMYDQwcsMVMI83eFoaoKFqUoBGTz6o7R9lQFj6Yja0S2SpEDTKCZ5y5kj80CCqv1KDWrRaio0jKJTRr0aatWIuycbYjyjr3Yp92Yd8EoAyz1bVqK01KjIKgSu9ZHaO0DTeFtZU2RVdEORLTGWtLGKy4m8tEqBEy08NcMCN4qvM6zmsc8WNx1DKMjs+WUrqKLH7GjVttS7GDt2g6hKyNyIb+mASzu0rTySIzEeadqSiBxNZzvT45bqM0UeVTHNu-r2cKDsOSGetnOPVCrTPSOrbNa5zngVnrl5NBc3O6LoZuxE2lvU9+kuN3QzeAZuwGTmSNOoTD+5e7e3e9-72vzSzvjhCe2iVmTM2ldPb5U1V89x4vy+t76acZ1nW-Y-uIRLWRXwTWlF8AIKhryGVkKKLQ8pRQqE0pZW+NExbW0Yr+eqHF277h7nrfeft2ZH08FIU+K0Iij0kEbMmNcrbVXrs5aKnFuK8Uku6DBGZd4+x7rg-uulIgSjFDISsXswi6GBgg2yVDH6oJchxWQ4VUDeTdl-OmcMwh1C9pWW47MVIPHmllXhgRprKEaJleB1kZ73zrig2hDVU4MHThjT+g1v4ZluG0ZaqgkrEyuCZbQulLx+C+IWLQ3M9I31Mb0ZALF7TMMUR7TCUC-CSHHhWQyzxQHzSNqcRoCg1CRC0BlSQ20zBeh9JAFhI1uYCFvBNJKtQrieLmp4T6R4smCBMjISpoT-h4F2vtBgh0ylw28EeTU54giVnytIcyhE5DqRuCAqI9YL6dJsmYbgrBSkxJzggb4S1vB1nUFoEBXw8aeEJgoM85YQgykMIYIAA */
  id: "Riven",
  initial: "Idle",
  context: ({ input }) => ({
    cache: input.cache,
    client: new ApolloClient({
      link: ApolloLink.from([
        new RetryLink({
          attempts: {
            max: parseInt(process.env["REQUEST_RETRIES"] ?? "3", 10),
          },
          delay: {
            initial: 1000,
            max: 10000,
          },
        }),
        new HttpLink({
          uri: "http://localhost:3000/graphql",
        }),
      ]),
      cache: new InMemoryCache(),
      dataMasking: true,
      devtools: {
        enabled: true,
      },
    }),
    plugins: new Map<symbol, RegisteredPlugin>(),
    sessionId: input.sessionId,
    server: null,
  }),
  on: {
    START: ".Initialising",
    EXIT: ".Shutdown",
    FATAL_ERROR: ".Errored",
  },
  states: {
    Idle: {},
    Initialising: {
      type: "parallel",
      states: {
        "Bootstrap database connection": {
          initial: "Starting",
          states: {
            Starting: {
              invoke: {
                id: "initialiseDatabaseConnection",
                src: "initialiseDatabaseConnection",
                onDone: "Complete",
                onError: {
                  target: "#Riven.Errored",
                  actions: {
                    type: "log",
                    params: ({ event }) => ({
                      message: `Failed to initialise database connection during bootstrap. Error: ${(event.error as Error).message}`,
                      level: "error",
                    }),
                  },
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
                input: ({ context }) => ({
                  cache: context.cache,
                }),
                onDone: {
                  target: "Complete",
                  actions: [
                    assign(({ event }) => ({
                      server: event.output.server,
                    })),
                    {
                      type: "log",
                      params: ({ event }) => ({
                        message: `GraphQL server ready at ${event.output.url}`,
                      }),
                    },
                  ],
                },
                onError: {
                  target: "#Riven.Errored",
                  actions: {
                    type: "log",
                    params: ({ event }) => ({
                      message: `Failed to start GraphQL server during bootstrap. Error: ${(event.error as Error).message}`,
                      level: "error",
                    }),
                  },
                },
              },
            },
            Complete: {
              entry: {
                type: "log",
                params: {
                  message: "GraphQL bootstrap complete.",
                },
              },
              type: "final",
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
                id: "registerPlugins",
                src: "registerPlugins",
                input: ({ context }) => ({
                  cache: context.cache,
                }),
                onDone: {
                  actions: [
                    assign({
                      plugins: ({ context, event, spawn, self }) => {
                        const pluginMap = new Map<symbol, RegisteredPlugin>();

                        for (const [
                          pluginSymbol,
                          { machine, config },
                        ] of event.output.entries()) {
                          const dataSources = new DataSourceMap();

                          if (config.dataSources) {
                            for (const DataSource of config.dataSources) {
                              try {
                                const rateLimiterRef = spawn(
                                  rateLimiterMachine,
                                  {
                                    input: {
                                      limiterOptions:
                                        DataSource.rateLimiterOptions ?? null,
                                    },
                                  },
                                );

                                const token = DataSource.getApiToken();
                                const instance = new DataSource({
                                  cache: context.cache,
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

                                    await waitFor(rateLimiterRef, (state) =>
                                      state.context.requestQueue.has(requestId),
                                    );

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
                                  `Failed to construct data source ${DataSource.name} for ${config.name.toString()}: ${
                                    (error as Error).message
                                  }`,
                                );
                              }
                            }
                          }

                          const pluginRef = spawn(machine, {
                            input: {
                              client: context.client,
                              dataSources,
                              pluginSymbol,
                              parentRef: self,
                            },
                          });

                          pluginMap.set(pluginSymbol, {
                            config,
                            dataSources,
                            machine,
                            ref: pluginRef,
                          });
                        }

                        return pluginMap;
                      },
                    }),
                  ],
                  target: "Validating",
                },
              },
            },
            Validating: {
              entry: {
                type: "log",
                params: {
                  message: "Starting plugin validation...",
                },
              },
              invoke: {
                id: "waitForValidPlugins",
                src: "waitForValidPlugins",
                input: ({ context }) => context.plugins,
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
                    ],
                  },
                  {
                    target: "Complete",
                    actions: [
                      {
                        type: "log",
                        params: {
                          message: "Plugins registered successfully.",
                        },
                      },
                    ],
                  },
                ],
              },
            },
            Complete: {
              entry: {
                type: "log",
                params: {
                  message: "Plugin bootstrap complete.",
                },
              },
              type: "final",
            },
          },
        },
      },
      onDone: "Running",
    },
    Running: {
      entry: [
        {
          type: "broadcastToPlugins",
          params: {
            type: "riven.started",
          },
        },
        {
          type: "log",
          params: {
            message: "Riven has started successfully.",
          },
        },
      ],
      on: {
        "riven.media-item.*": {
          actions: [
            {
              type: "broadcastToPlugins",
              params: ({ event }) => event,
            },
          ],
        },
      },
    },
    Errored: {
      entry: {
        type: "log",
        params: {
          message: "A fatal error occurred during bootstrap.",
          level: "error",
        },
      },
    },
    Shutdown: {
      entry: [
        emit({ type: "riven.shutdown" }),
        {
          type: "log",
          params: {
            message: "Riven is shutting down.",
          },
        },
      ],
      invoke: [
        {
          id: "stopGqlServer",
          src: "stopGqlServer",
          input: ({ context }) => context.server,
          onDone: "Exited",
        },
      ],
    },
    Exited: {
      entry: [
        emit({ type: "riven.exited" }),
        {
          type: "log",
          params: {
            message: "Riven has exited.",
          },
        },
      ],
      type: "final",
    },
  },
});
