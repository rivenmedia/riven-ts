import { type LogLevel, logger } from "@repo/core-util-logger";
import {
  DataSourceMap,
  type BaseDataSource,
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
import type { KeyvAdapter } from "@apollo/utils.keyvadapter";
import type { UUID } from "node:crypto";
import {
  assign,
  emit,
  setup,
  toPromise,
  waitFor,
  type ActorRefFromLogic,
} from "xstate";

import { initialiseDatabaseConnection } from "./actors/initialise-database-connection.actor.ts";
import {
  type RegisteredPlugin,
  registerPlugins,
} from "./actors/register-plugins.actor.ts";
import { startGqlServer } from "./actors/start-gql-server.actor.ts";
import { stopGqlServer } from "./actors/stop-gql-server.actor.ts";
import { waitForValidPlugins } from "./actors/wait-for-valid-plugins.actor.ts";
import { rateLimiterMachine } from "../rate-limiter/index.js";
import type { FetcherRequestInit } from "@apollo/utils.fetcher";

export interface BootstrapMachineContext {
  cache: KeyvAdapter;
  client: ApolloClient;
  plugins: Map<symbol, RegisteredPlugin>;
  sessionId: UUID;
  server: ApolloServer | null;
  rateLimiters: Map<
    BaseDataSource,
    ActorRefFromLogic<typeof rateLimiterMachine>
  >;
}

export interface BootstrapMachineInput {
  cache: KeyvAdapter;
  sessionId: UUID;
}

export const bootstrapMachine = setup({
  types: {
    context: {} as BootstrapMachineContext,
    emitted: {} as ProgramToPluginEvent,
    events: {} as
      | { type: "START" }
      | { type: "FATAL_ERROR" }
      | { type: "EXIT" },
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7AxAZQBUBBZAgbQAYBdRUABwHtZUAXVBrWkAD0QBYATABoQAT36CAdHwCccgMwV5MioIBsfAOwBfbSLSZcAUQAaASXLUujZmw5deCQSPEIBA+ZIGyZADj5qHh6B8rr6GNg4AGJExAAyAPpGyMgA8siUNEggNqzsnNmOzmKIAIzKknJyvmq+AKylfOVqOnogBtiSZlh5AIYANqjMWFA4EBxgkrAsvSyTHVhdPWwDQ6gjmdZMefaFiDKaFJKa8nzyjS2+qnW+LhKeVSpq8h5+N2HtEYvdfYPDUJJkGAoEM5gAnAAEdH6AFcQVhYIDgaCwGD1qNxlhJut0AwANaTMHI6aogAKsPhsE22VydgKoEcdSaXh8MjqFDqTw8dycaiOmhOp05vhqijUujaWAYEDgXAWW1s+QciAAtGoeWqPgsuhB+mAFTt6Tx+MISghfKVpI9fIoBDdBFqvktfmsRga6cqEKVSppJL4BBbVP5lHwbabXAJDpUqt5TjI+LI6o7DM6Vn90UiQSTIdC4et4DTth69l61HU-QHSkGzvGwzz5DcrX4bWzZHyZMnOj8066AUCs+CoRT85mUWi3YXFbsGYgBOUK4HQzXQy8eQny48BBRW2ofTbO99lqhVv9R9mh3mEWfwZB3UqS5opHPfI-ShblKUZGu6r7HwoRW+dR1MorThCmyAwlgPQTvQRb3jOXoUPUkjKDaJyfiuBxrhQahNjIpQCAcAplgEB6SEYYJggwRIQHe07Gm4OGVI0FACCE3g1EBPIsXhNT1I0zSgZ8KZGNwrC3pOhqeluuH4XwrHsaGZZ1NxfjRlUWihgKbLihKQA */
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
    rateLimiters: new Map(),
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
                      plugins: ({ context, event, spawn }) => {
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
