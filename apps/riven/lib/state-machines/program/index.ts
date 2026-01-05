import type { ShutdownEvent } from "@repo/util-plugin-sdk/program-to-plugin-events/core/shutdown";

import type { ApolloServer } from "@apollo/server";
import type { UUID } from "node:crypto";
import { type AnyActorRef, assign, setup } from "xstate";

import { bootstrapMachine } from "../bootstrap/index.ts";
import { mainRunnerMachine } from "../main-runner/index.ts";
import type { PendingRunnerInvocationPlugin } from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { stopGqlServer } from "./actors/stop-gql-server.actor.ts";

export interface RivenMachineContext {
  mainRunnerRef?: AnyActorRef;
  plugins?: Map<symbol, PendingRunnerInvocationPlugin>;
  server?: ApolloServer;
}

export interface RivenMachineInput {
  sessionId: UUID;
}

export type RivenMachineEvent = ShutdownEvent;

export const rivenMachine = setup({
  types: {
    context: {} as RivenMachineContext,
    events: {} as RivenMachineEvent,
    input: {} as RivenMachineInput,
    children: {} as {
      bootstrapMachine: "bootstrapMachine";
      stopGqlServer: "stopGqlServer";
      mainRunnerMachine: "mainRunnerMachine";
    },
  },
  actions: {
    storeGqlServerInstance: assign({
      server: (_, server: ApolloServer) => server,
    }),
  },
  actors: {
    bootstrapMachine,
    mainRunnerMachine,
    stopGqlServer,
  },
})
  .extend(withLogAction)
  .createMachine({
    id: "Riven",
    initial: "Bootstrapping",
    on: {
      "riven.core.shutdown": ".Shutdown",
    },
    states: {
      Bootstrapping: {
        invoke: {
          id: "bootstrapMachine",
          src: "bootstrapMachine",
          input: ({ self }) => ({ rootRef: self }),
          onDone: {
            actions: assign(({ spawn, event }) => ({
              server: event.output.server,
              mainRunnerRef: spawn(mainRunnerMachine, {
                input: {
                  plugins: event.output.plugins,
                },
              }),
            })),
            target: "Running",
          },
          onError: {
            target: "Errored",
            actions: {
              type: "log",
              params: ({ event }) => ({
                message: `Error during bootstrap: ${(event.error as Error).message}`,
                level: "error",
              }),
            },
          },
        },
      },
      Running: {},
      Errored: {
        type: "final",
        entry: {
          type: "log",
          params: {
            message: "A fatal error occurred.",
            level: "error",
          },
        },
      },
      Shutdown: {
        entry: [
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
        type: "final",
        entry: [
          {
            type: "log",
            params: {
              message: "Riven has exited.",
            },
          },
        ],
      },
    },
  });
