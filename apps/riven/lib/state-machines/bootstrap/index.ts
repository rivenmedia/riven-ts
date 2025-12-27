import { checkServerStatus } from "./actors/check-server-status.actor.ts";
import { checkPluginStatuses } from "./actors/check-plugin-statuses.actor.ts";
import { registerPlugins } from "./actors/register-plugins.actor.ts";
import { mediaProcessorMachine } from "../media-processor/index.ts";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { emit, raise, setup, type MachineContext } from "xstate";
import { logger } from "@repo/core-util-logger";
import { SubscribableProgramEvent } from "@repo/util-plugin-sdk";

export interface BootstrapMachineContext extends MachineContext {
  client: ApolloClient;
}

type BootstrapMachineEvent =
  | { type: "START" }
  | { type: "FATAL_ERROR" }
  | { type: "EXIT" };

interface BootstrapMachineEmittedEvent {
  type: SubscribableProgramEvent;
}

export const bootstrapMachine = setup({
  types: {
    context: {} as BootstrapMachineContext,
    emitted: {} as BootstrapMachineEmittedEvent,
    events: {} as BootstrapMachineEvent,
  },
  actors: {
    checkServerStatus,
    checkPluginStatuses,
    registerPlugins,
    mediaProcessorMachine,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABAIwHsCAXWYgJwEMAHascgYgGUAVAQWRYG0AGAXUShqBWKmKoCWQSAAeiACwAmADQgAnogBsAZgCMAOkU89AVgAcATk06Tu3QF97qtJlyESZKrXoMAogA0ASW5+aWFRcUlpOQQlVQ0ERUVtQxMeHjNNAHZNE20LRUdnDGx8IlIKGjpGADE2dgAZAH1fZGQAeWReASQQcLEJKV6YuPVEXXz9C2np-LSc5KKQF1L3Cq9q-UCsAcoAG1RRLCgGCEkwfTJKYguVt3LPKvotnfF9w9Rj7rCRAajh8baEzyQxmXRGCyZLI8RRmMzxLTaRT6aF6JS2RQWfKaJZ3MoeSrecgvXYHI5QfQAYQAFmAAMYAaxwsHomHIzOI1wArrAqbTGZ8TmcsBdPugCAzbiV7gSNs9tqSPsc+fSmSzyGyOdzeTTVYKEGKCHTroNut9ev1IkNQCNsvoePJNGZFEpNPIzBkTAiECYnfp5HldPJdDxctDMrjpfj1k9iQq3mTBSrGczWfQtcQecmGYKGPRyARidQ9tcAGaFgC2+jxa0eRJJCaVFN1KfVmqumZ1-JzxwNWHFxqtZtCFt+VuiiGSKXSWRy8khuUs8m98kd9vSPBMLu0WWdmMjrmjdc28dQ73J1bAUEON3Zxa516wvOQV5v9FzwtF-YlUsPtcJJ6vGeibKi+15kOm96Ps+r4QeQ+qGoOpr8OaQhjoME6xNomj6M6MLyNo6ROsYwLemYJhZPoFGwuRkKKNRB6rA8AHykB55JmBb53nsD6fDB4G3pApznPohqStWUb-nKcZsSBFKcXBOBQXxl4CfQkB9gOJqSMOPRoREGEAggliURRMKaKGzqrm6ZFZMiuSaEYAZWFu+5OMsknMdJDbAU2qlcUpPHQf5cFCfmhb6MWZaVhJf5ebGPnsaBsG3oFvFPiFgkQJpRraVguk-AZ-w2lothTE6WQBjoFgmBYujwmMCBZGkhjGHYtVOjodmOO5WAEBAcDSDW8VEoVfzWrIiAALSaN6M2MTKMb1oEEB7GAY3jkZowJGCVEbjwdlJHVQImAtR4sTJirkhthklQgdiUc6HrQpi7r5Noy6NYoWQGBuIY8AUG5ZNoZ1SQlp5Jc23aphq6YdjyN3FZN93QrhsIHTCFhvVin0JECZh7TO1i7nVtigyNgFXUmLZqmm7Lw12erHIjE0xIo9Vo89mPYx93rAikNV6DYs71bV5OyuDsl+TTMPtpynb6AAEmA+zENSCT6eNmGaFihhKN91X1Touh80oKJtZougmL6QIFOLS2U42F4KalylPizmG6LknMY69ZjvbjWiOebSJtTulUOO5w0S8tUvOylkFBSpLvvszo5Fazk4TD7L1Y-7ONkdo052RYGTzvIDpY-bx6sVTyVqdx6X8VxkAe0ZXUonCkIerokKESojVmO6+hW4530hh66Qg1Hnkx47vnxw3aXBQAau8EDXK36da0ZdhAvoSJgpubqWy6FhkWupeW45Vt1Y51cXdWXJYDsaea5td1Bn6WOBhYu5pNhWajVzDIiMELaEFdnRWAft5Xw5ACzkC3u-W6yMjA4TqsGSB4J-ZTm9EGHg-oZiOmavIZq2EYEJV8DIMQSC+joSRmzUMUwgz4LBLCJERc8HTHXOkWqRdMj0VOj1IAA */
  id: "Riven bootstrapper",
  initial: "Idle",
  context: () => ({
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
        "Check server status": {
          initial: "Checking",
          states: {
            Checking: {
              entry() {
                logger.info("Checking server status...");
              },
              invoke: {
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
                src: "registerPlugins",
                input: {},
                onDone: "Registered",
              },
            },
            Registered: {
              entry() {
                logger.info("Plugins registered. Checking plugin health...");
              },
              invoke: {
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
        () => {
          logger.info("Riven is running!");
        },
      ],
      invoke: {
        src: "mediaProcessorMachine",
      },
    },
    Errored: {},
    Exited: {
      entry: emit({ type: "riven.exited" }),
      type: "final",
    },
  },
});
