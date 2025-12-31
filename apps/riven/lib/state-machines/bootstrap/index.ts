import type { UUID } from "node:crypto";
import { checkServerStatus } from "./actors/check-server-status.actor.ts";
import { checkPluginStatuses } from "./actors/check-plugin-statuses.actor.ts";
import {
  registerPlugins,
  type RegisteredPlugin,
} from "./actors/register-plugins.actor.ts";
import { waitForValidPlugins } from "./actors/wait-for-valid-plugins.actor.ts";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { assign, emit, setup } from "xstate";
import { logger, type LogLevel } from "@repo/core-util-logger";
import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk";
import type { KeyvAdapter } from "@apollo/utils.keyvadapter";

export interface BootstrapMachineContext {
  cache: KeyvAdapter;
  client: ApolloClient;
  plugins: Map<symbol, RegisteredPlugin>;
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
      checkServerStatus: "checkServerStatus";
      checkPluginStatuses: "checkPluginStatuses";
      waitForValidPlugins: "waitForValidPlugins";
    },
    input: {} as {
      cache: KeyvAdapter;
      sessionId: UUID;
    },
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
    checkServerStatus,
    checkPluginStatuses,
    registerPlugins,
    waitForValidPlugins,
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
  }),
  on: {
    START: ".Initialising",
    EXIT: ".Exited",
    FATAL_ERROR: ".Errored",
  },
  states: {
    Idle: {},
    Initialising: {
      type: "parallel",
      states: {
        "Bootstrap plugins": {
          initial: "Registering",
          states: {
            Registering: {
              entry: {
                type: "log",
                params: {
                  message: "Starting plugin registration...",
                },
              },
              invoke: {
                id: "registerPlugins",
                src: "registerPlugins",
                input: ({ context }) => ({
                  cache: context.cache,
                }),
                onDone: {
                  actions: assign({
                    plugins: ({ context, event, spawn }) => {
                      const pluginMap = new Map<symbol, RegisteredPlugin>();

                      for (const [
                        pluginSymbol,
                        { machine, dataSources },
                      ] of event.output.entries()) {
                        const pluginRef = spawn(machine, {
                          input: {
                            client: context.client,
                            dataSources,
                            pluginSymbol,
                          },
                        });

                        pluginMap.set(pluginSymbol, {
                          dataSources,
                          machine,
                          ref: pluginRef,
                        });
                      }

                      return pluginMap;
                    },
                  }),
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
