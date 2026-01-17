import { type AnyActorRef, assign, setup } from "xstate";

import { bootstrapMachine } from "../bootstrap/index.ts";
import { mainRunnerMachine } from "../main-runner/index.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { stopGqlServer } from "./actors/stop-gql-server.actor.ts";

import type { PendingRunnerInvocationPlugin } from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { ApolloServer } from "@apollo/server";
import type { CoreShutdownEvent } from "@repo/util-plugin-sdk/schemas/events/core.shutdown.event";
import type Fuse from "fuse-native";
import type { UUID } from "node:crypto";

export interface RivenMachineContext {
  mainRunnerRef?: AnyActorRef;
  plugins?: Map<symbol, PendingRunnerInvocationPlugin>;
  server?: ApolloServer;
  vfs?: Fuse;
}

export interface RivenMachineInput {
  sessionId: UUID;
}

export type RivenMachineEvent = CoreShutdownEvent;

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
              vfs: event.output.vfs,
              mainRunnerRef: spawn(mainRunnerMachine, {
                input: {
                  plugins: event.output.plugins,
                  queues: event.output.queues,
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
        type: "parallel",
        entry: [
          {
            type: "log",
            params: {
              message: "Riven is shutting down.",
            },
          },
        ],
        onDone: "Exited",
        states: {
          "Shutting down GQL server": {
            initial: "Shutting down",
            states: {
              "Shutting down": {
                invoke: {
                  id: "stopGqlServer",
                  src: "stopGqlServer",
                  input: ({ context }) => context.server,
                  onDone: "Stopped",
                  onError: {
                    target: "Stopped",
                    actions: {
                      type: "log",
                      params: ({ event }) => ({
                        message: `Error while shutting down GQL server: ${(event.error as Error).message}`,
                        level: "error",
                      }),
                    },
                  },
                },
              },
              Stopped: {
                type: "final",
                entry: {
                  type: "log",
                  params: {
                    message: "GQL server has been stopped.",
                  },
                },
              },
            },
          },
        },
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
