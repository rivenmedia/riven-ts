import { checkServerStatus } from "./actors/check-server-status.actor.ts";
import { checkPluginStatuses } from "./actors/check-plugin-statuses.actor.ts";
import { registerPlugins } from "./actors/register-plugins.actor.ts";
import { processRequestedItems } from "./actors/process-requested-items.actor.ts";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import {
  assign,
  emit,
  raise,
  setup,
  spawnChild,
  type ActorRef,
  type AnyActorRef,
  type Snapshot,
} from "xstate";
import { logger } from "@repo/core-util-logger";
import {
  SubscribableProgramEvent,
  type PublishableProgramEvent,
} from "@repo/util-plugin-sdk";
import type { KeyvAdapter } from "@apollo/utils.keyvadapter";

interface RivenMachineEvent {
  type: SubscribableProgramEvent;
}

type PluginRef = ActorRef<Snapshot<unknown>, RivenMachineEvent>;

export const bootstrapMachine = setup({
  types: {
    context: {} as {
      cache: KeyvAdapter;
      client: ApolloClient;
      plugins: Map<symbol, PluginRef>;
    },
    emitted: {} as RivenMachineEvent,
    events: {} as
      | PublishableProgramEvent
      | { type: "START" }
      | { type: "FATAL_ERROR" }
      | { type: "EXIT" },
    children: {} as {
      registerPlugins: "registerPlugins";
      checkServerStatus: "checkServerStatus";
      checkPluginStatuses: "checkPluginStatuses";
      processRequestedItems: "processRequestedItems";
    },
    input: {} as {
      cache: KeyvAdapter;
    },
  },
  actors: {
    checkServerStatus,
    checkPluginStatuses,
    registerPlugins,
    processRequestedItems,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABAIwHsCAXWYgJwEMAHascgYgGUAVAQWRYG0AGAXUShqBWKmKoCWQSAAeiACwAmADQgAnogBsAZgCMAOkU89AVgAcATk06Tu3QF97qtJlyESZKrXoMAogA0ASW5+aWFRcUlpOQQlVQ0ERUVtQxMeHjNNAHZNE20LRUdnDGx8IlIKGjpGADE2dgAZAH1fZGQAeWReASQQcLEJKV6YuPVEXXz9C2np-LSc5KKQF1L3Cq9q-UCsAcoAG1RRLCgGCEkwfTJKYguVt3LPKvotnfF9w9Rj7rCRAajh8baEzyQxmXRGCyZLI8RRmMzxLTaRT6aF6JS2RQWfKaJZ3MoeSrecgvXYHI5QfQAYQAFmAAMYAaxwsHomHIzOI1wArrAqbTGZ8TmcsBdPugCAzbiV7gSNs9tqSPsc+fSmSzyGyOdzeTTVYKEGKCHTroNut9ev1IkNQCNsvoePJNGZFEpNPIzBkTAiECYnfp5HldPJdDxctDMrjpfj1k9iQq3mTBSrGczWfQtcQecmGYKGPRyARidQ9tcAGaFgC2+jxa0eRJJCaVFN1KfVmqumZ1-JzxwNWHFxqtZtCFt+VuiiGSKXSWRy8khuUs8m98kd9vSPBMLu0WWdmMjrmjdc28dQ73J1bAUEON3Zxa516wvOQV5v9FzwtF-YlUsPtcJJ6vGeibKi+15kOm96Ps+r4QeQ+qGoOpr8OaQhjoME6xNomj6M6MLyNo6ROsYwLemYJhZPoFGwuRkKKNRB6rA8AHykB55JmBb53nsD6fDB4G3pApznPohqStWUb-nKcZsSBFKcXBOBQXxl4CfQkB9gOJqSMOPRoREGEAggliURRMKaKGzqrm6ZFZMiuSaEYAZWFu+5OMsknMdJDbAU2qlcUpPHQf5cFCfmhb6MWZaVhJf5ebGPnsaBsG3oFvFPiFgkQJpRraVguk-AZ-w2lothTE6WQBjoFgmBYujwmMCBZGkhjGHYtVOjodmOO5WAEBAcDSDW8VEoVfzWrIiAALSaN6M2MTKMb1oEEB7GAY3jkZowJGCVEbjwdlJHVQImAtR4sTJirkhthklQgdiUc6HrQpi7r5Noy6NYoWQGBuIY8AUG5ZNoZ1SQlp5Jc23aphq6YdjyN3FZN93QrhsIHTCFhvVin0JECZh7TO1i7nVtigyNgFXUmLZqmm7Lw12erHIjE0xIo9Vo89mPYx93rAikNV6DYs71bV5OyuDsl+TTMPtpynb6AAEmA+zENSCT6eNmGaFihhKN91X1Touh80oKJtZougmL6QIFOLS2U42F4KalylPizmG6LknMY69ZjvbjWiOebSJtTulUOO5w0S8tUvOylkFBSpLvvszo5Fazk4TD7L1Y-7ONkdo052RYGTzvIDpY-bx6sVTyVqdx6X8VxkAe0ZXUonCkIerokKESojVmO6+hW4530hh66Qg1Hnkx47vnxw3aXBQAau8EDXK36da0ZdhAvoSJgpubqWy6FhkWupeW45Vt1Y51cXdWXJYDsaea5td1Bn6WOBhYu5pNhWajVzDIiMELaEFdnRWAft5Xw5ACzkC3u-W6yMjA4TqsGSB4J-ZTm9EGHg-oZiOmavIZq2EYEJV8DIMQSC+joSRmzUMUwgz4LBLCJERc8HTHXOkWqRdMj0VOj1IAA */
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
    plugins: new Map<symbol, PluginRef>(),
  }),
  on: {
    START: ".Initialising",
    EXIT: ".Exited",
    FATAL_ERROR: ".Errored",
    "media:requested": {
      actions: spawnChild("processRequestedItems", {
        id: "processRequestedItems",
        input: ({ event }) => ({
          items: event.type === "media:requested" ? event.data : [],
        }),
      }),
    },
  },
  states: {
    Idle: {},
    Initialising: {
      type: "parallel",
      states: {
        "Check server status": {
          initial: "Checking",
          states: {
            Checking: {
              entry() {
                logger.info("Checking server status...");
              },
              invoke: {
                id: "checkServerStatus",
                src: "checkServerStatus",
                onError: {
                  actions: raise({ type: "FATAL_ERROR" }),
                },
                onDone: "Healthy",
                input: ({ context }) => ({
                  client: context.client,
                }),
              },
            },
            Healthy: {
              entry() {
                logger.info("Server is healthy");
              },
              type: "final",
            },
          },
        },
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
                input: {},
                onDone: {
                  actions: assign({
                    plugins: ({ context, event, spawn, self }) => {
                      const pluginMap = new Map<symbol, AnyActorRef>();

                      for (const plugin of event.output) {
                        const pluginActor = spawn(plugin.stateMachine, {
                          input: {
                            parentRef: self,
                            cache: context.cache,
                          },
                        });

                        pluginMap.set(plugin.name, pluginActor);
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
                logger.info("Plugins registered. Checking plugin health...");
              },
              invoke: {
                id: "checkPluginStatuses",
                src: "checkPluginStatuses",
                onError: {
                  actions: raise({ type: "FATAL_ERROR" }),
                },
                onDone: "Validated",
                input: ({ context }) => ({
                  client: context.client,
                }),
              },
            },
            Validated: {
              entry() {
                logger.info("Plugins are healthy.");
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
        emit({ type: "riven.running" }),
        ({ context }) => {
          context.plugins.forEach((actor) => {
            actor.send({ type: "riven.running" });
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
