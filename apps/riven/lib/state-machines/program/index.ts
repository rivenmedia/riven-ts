import { checkServerStatus } from "./actors/check-server-status.actor.ts";
import { checkPluginStatuses } from "./actors/check-plugin-statuses.actor.ts";
import { registerPlugins } from "./actors/register-plugins.actor.ts";
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

export interface ProgramStateMachineContext extends MachineContext {
  client: ApolloClient;
  serverHealthy?: boolean;
  pluginsHealthy?: boolean;
}

type ProgramStateMachineEvent =
  | { type: "START" }
  | { type: "FATAL_ERROR" }
  | { type: "EXIT" };

interface ProgramStateMachineEmittedEvent {
  type: SubscribableProgramEvent;
}

export const programStateMachine = setup({
  types: {
    context: {} as ProgramStateMachineContext,
    emitted: {} as ProgramStateMachineEmittedEvent,
    events: {} as ProgramStateMachineEvent,
  },
  actors: {
    checkServerStatus,
    checkPluginStatuses,
    registerPlugins,
  },
}).createMachine({
  /** @xstate-layout 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-nuFcEAA */
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
                },
                onDone: "Healthy",
                input: ({ context }) => ({
                  client: context.client,
                }),
              },
            },
            Healthy: { type: "final" },
          },
        },
        "Register plugins": {
          initial: "Registering",
          states: {
            Registering: {
              invoke: {
                src: "registerPlugins",
                input: {},
                onDone: "Registered",
              },
            },
            Registered: {
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
    },
    Errored: {},
    Exited: {
      entry: [
        emit({ type: SubscribableProgramEvent.enum["riven.exited"] }),
        () => {
          logger.info("Riven has shut down");
        },
      ],
      type: "final",
    },
  },
});
