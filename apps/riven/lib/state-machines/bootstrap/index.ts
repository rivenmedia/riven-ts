import { checkServerStatus } from "./actors/check-server-status.actor.ts";
import { checkPluginStatuses } from "./actors/check-plugin-statuses.actor.ts";
import {
  registerPlugins,
  type RegisteredPlugin,
} from "./actors/register-plugins.actor.ts";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { assign, emit, setup } from "xstate";
import { logger } from "@repo/core-util-logger";
import {
  type PluginToProgramEvent,
  type ProgramToPluginEvent,
} from "@repo/util-plugin-sdk";
import type { KeyvAdapter } from "@apollo/utils.keyvadapter";

export const bootstrapMachine = setup({
  types: {
    context: {} as {
      cache: KeyvAdapter;
      client: ApolloClient;
      plugins: Map<symbol, RegisteredPlugin>;
    },
    emitted: {} as ProgramToPluginEvent,
    events: {} as
      | PluginToProgramEvent
      | { type: "START" }
      | { type: "FATAL_ERROR" }
      | { type: "EXIT" },
    children: {} as {
      registerPlugins: "registerPlugins";
      checkServerStatus: "checkServerStatus";
      checkPluginStatuses: "checkPluginStatuses";
    },
    input: {} as {
      cache: KeyvAdapter;
    },
  },
  actors: {
    checkServerStatus,
    checkPluginStatuses,
    registerPlugins,
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
    pluginEventHandlers: {},
    plugins: new Map<symbol, RegisteredPlugin>(),
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
        "Register plugins": {
          initial: "Registering",
          states: {
            Registering: {
              entry() {
                logger.info("Registering plugins...");
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
                        pluginName,
                        { machine, dataSources },
                      ] of event.output.entries()) {
                        const pluginRef = spawn(machine, {
                          input: {
                            client: context.client,
                            dataSources,
                            pluginName,
                          },
                        });

                        pluginMap.set(pluginName, {
                          dataSources,
                          machine,
                          ref: pluginRef,
                        });
                      }

                      return pluginMap;
                    },
                  }),
                  target: "Registered",
                },
              },
            },
            Registered: {
              entry() {
                logger.info("Plugins registered.");
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
        ({ context }) => {
          context.plugins.forEach(({ ref }) => {
            ref?.send({ type: "riven.started" });
          });
        },
        () => {
          logger.info("Riven is running!");
        },
      ],
    },
    Errored: {},
    Exited: {
      entry: emit({ type: "riven.exited" }),
      type: "final",
    },
  },
});
