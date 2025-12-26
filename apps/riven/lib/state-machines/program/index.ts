import { checkServerStatus } from "./actors/check-server-status.actor.ts";
import { checkPluginStatuses } from "./actors/check-plugin-statuses.actor.ts";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { raise, setup, type MachineContext } from "xstate";
import { logger } from "@repo/core-util-logger";

export interface ProgramStateMachineContext extends MachineContext {
  client: ApolloClient;
  serverHealthy?: boolean;
  pluginsHealthy?: boolean;
}

type ProgramStateMachineEvent =
  | { type: "START" }
  | { type: "FATAL_ERROR" }
  | { type: "EXIT" };

export const programStateMachine = setup({
  types: {
    context: {} as ProgramStateMachineContext,
    events: {} as ProgramStateMachineEvent,
  },
  actors: {
    checkServerStatus,
    checkPluginStatuses,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAUBOB7KqCGBbABLAC7ZFj67YDGAFgJYB2YAxAMoAqAggErsDaABgC6iUAAd0sOkTroGokAA9EAFgBMAGhABPRADYBagHQB2AQGYBADisBWdQEY1AgJwBfN1rSYcBYqXJKWkYWAFEADQBJfmEFCSkZOQVlBHUtXQQ1FT1TFRcXE3MXC3MVFXMTDy8MLDxCEjIKanomZgAxTi4AGQB9UO5uAHluQREkEHjpWXlxlLSdRAcio3z8m3M9FVtbJyqQb1q-BsDmkKNIhinsABs6KQYoZgg5MCN-MiMD33qApuCmc6XGQ3O6MKCjOKSKZJWaIFxqFxGDYmBwmWwudEmPQOFzpfQCFRGZzmBwEqzONRWJZ7L51d4nf6vC5XW73KBGADCNDAVAA1oQwKgAG6Cn5EACusE53L5YKeLyMjCF6F5r1pR1+QRaTKBdBBbOlPP5sEFItQYslhtlDwQSvQVFI01GEPGk0SM1Acz0xgJenWAhMLisLiWeNSKNyaysemR5jsNJq33pf21gJZoIeVuNptF70tXKNcsFGFQRjE11IADN0KhcJ9E3TjimzszgaywVmBcLcw18zLeWDbQxlQ73c7Yq6oe7kqpvUZff7A8HQwsEDtEVl8oGsfDsg4Ez5G5rTgDW3r25mC3z8OXxVBGBapVeBw95QC7ar64eNY0tS3dfqHbPje1x3g+eZPv2g52qOTrCC64hTtMM7huYRgGC4Gx6JstgmI4JhhiYahoRiljbLhAbovunj7A2P4MqmZ6AZe-YgWBDCPlmRaoCWZYVkQ1a1l+hxigx-7pgawG3veHEQVxNowY6cjjmMiEJMhsKoehrhYTheFqKihERlsJKogiDjlCYlR7Aw6AQHACjqqJzZMJC6kwp6iAALR6GGPnzgIgVBcFQXWdU37OX+p4QNcYBudCHpKKomirlSRh5Ks+R6EG1g4geInJlFOoSWC8XTppDiokY5JUmo2HlKRAi+auCKEhlGKFLYdgovlSZNkVaZthm7LASa3bmhBZUaZ5CAOHotjVZSTj1UUtiWM1GRxg4KyrH6FQCJVei9Uev4nsVQ2SaxY1mpxz6lZO7mJSkBloTVy2bKt61hrYFhEnV9hWcGth1Wox30S553nsNnbXT2pCWm02B0KBqBxQ9CUoX6VhEuoaiUjYCJUio33LER81xoFLhlLYR00U5hVnYNUOXUaXY3XJrDilQVBwPA6PlTNWM43j+PkkGFlhtkiLtYGW3YdR4UFf1jNMReI2sdJ4G9nzakYxV82LbVK2NRt+ilESFikl18KWFiYORSrAFq52muydr8lQFNHlJZkSyG+9DVrU1hHbOlCJ+mtlUoiYVj2wzjJM8x6us67nGI8j4qo17T2ICi23InNAbOJiBGroG23wi4ehopHMY9XTdEOwnqvQ1JoEyZxnPc7z2coXnSLV4XRECCXhEGaYltzcUcbA7Tit9ceCfcOKDCXA8vcVQShKW8RQcFCG5jfYGE+WNGWx2PYKhx8rCehDxNaQBvM3ODkIYqE1H3mOiVjE6uh07Wsb0VhXA-2xNfReqZQiKGkI-fm00fZLGxnkAymEuoj1KMDMMIt0qrBjj-SkBg-QeA8EAA */
  id: "Program state machine",
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
              invoke: {
                src: "checkServerStatus",
                onError: {
                  actions: raise({ type: "FATAL_ERROR" }),
                  target: "Failure",
                },
                onDone: "Success",
                input: ({ context }) => ({
                  client: context.client,
                }),
              },
            },
            Failure: { type: "final" },
            Success: { type: "final" },
          },
        },
        "Check plugin status": {
          initial: "Checking",
          states: {
            Checking: {
              invoke: {
                src: "checkPluginStatuses",
                onError: {
                  actions: raise({ type: "FATAL_ERROR" }),
                  target: "Failure",
                },
                onDone: "Success",
                input: ({ context }) => ({
                  client: context.client,
                }),
              },
            },
            Failure: { type: "final" },
            Success: { type: "final" },
          },
        },
      },
      onDone: "Running",
    },
    Running: {
      entry() {
        logger.info("Riven is running!");
      },
    },
    Errored: {
      entry() {
        logger.debug(
          "Errored state entered due to unhealthy server or plugins.",
        );
      },
    },
    Exited: {
      entry() {
        logger.info("Riven has shut down");
      },
      type: "final",
    },
  },
});
