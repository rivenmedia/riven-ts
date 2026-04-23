import { type AnyActorRef, assign, setup } from "xstate";

import { bootstrapMachine } from "../bootstrap/index.ts";
import { mainRunnerMachine } from "../main-runner/index.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { shutdown } from "./actors/shutdown.actor.ts";
import { stopGqlServer } from "./actors/stop-gql-server.actor.ts";
import { unmountVfs } from "./actors/unmount-vfs.actor.ts";

import type { ValidPluginMap } from "../../types/plugins.ts";
import type { ApolloServer } from "@apollo/server";
import type { ApolloServerContext } from "@repo/core-util-graphql-schema";
import type { CoreShutdownEvent } from "@repo/util-plugin-sdk/schemas/events/core.shutdown.event";
import type Fuse from "@zkochan/fuse-native";
import type { UUID } from "node:crypto";

export interface RivenMachineContext {
  mainRunnerRef?: AnyActorRef;
  plugins?: ValidPluginMap;
  server?: ApolloServer<ApolloServerContext>;
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
      shutdown: "shutdown";
      unmountVfs: "unmountVfs";
    },
  },
  actors: {
    bootstrapMachine,
    mainRunnerMachine,
    shutdown,
    stopGqlServer,
    unmountVfs,
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
            actions: assign(
              ({
                spawn,
                self,
                event: {
                  output: {
                    server,
                    vfs,
                    plugins,
                    publishableEvents,
                    pluginQueues,
                    pluginWorkers,
                  },
                },
              }) => ({
                server,
                vfs,
                mainRunnerRef: spawn(mainRunnerMachine, {
                  input: {
                    parentRef: self,
                    plugins,
                    publishableEvents,
                    pluginQueues,
                    pluginWorkers,
                  },
                }),
              }),
            ),
            target: "Running",
          },
          onError: {
            target: "Errored",
            actions: {
              type: "log",
              params: ({ event: { error } }) => ({
                message: "Error during bootstrap",
                level: "error",
                error,
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
        initial: "Shutting down main runner",
        onDone: "Exited",
        entry: [
          {
            type: "log",
            params: {
              message: "Riven is shutting down.",
            },
          },
        ],
        states: {
          "Shutting down main runner": {
            invoke: {
              id: "shutdown",
              src: "shutdown",
              input: ({ context: { mainRunnerRef } }) => ({
                mainRunnerRef: mainRunnerRef,
              }),
              onError: {
                target: "Unmounting VFS",
                actions: {
                  type: "log",
                  params: ({ event: { error } }) => ({
                    message: "Error whilst shutting down main runner",
                    level: "error",
                    error,
                  }),
                },
              },
              onDone: {
                target: "Unmounting VFS",
                actions: {
                  type: "log",
                  params: {
                    message: "Main runner has been shut down successfully.",
                  },
                },
              },
            },
          },
          "Unmounting VFS": {
            invoke: {
              id: "unmountVfs",
              src: "unmountVfs",
              input: ({ context: { vfs } }) => vfs,
              onDone: {
                target: "Shutting down services",
                actions: {
                  type: "log",
                  params: {
                    message: "VFS has been unmounted successfully.",
                  },
                },
              },
              onError: {
                target: "Shutting down services",
                actions: {
                  type: "log",
                  params: ({ event: { error } }) => ({
                    message: "Error whilst unmounting VFS",
                    level: "error",
                    error,
                  }),
                },
              },
            },
          },
          "Shutting down services": {
            type: "parallel",
            onDone: "All services shut down",
            states: {
              "Shutting down GQL server": {
                initial: "Shutting down",
                states: {
                  "Shutting down": {
                    invoke: {
                      id: "stopGqlServer",
                      src: "stopGqlServer",
                      input: ({ context: { server } }) => server,
                      onDone: "Stopped",
                      onError: {
                        target: "Stopped",
                        actions: {
                          type: "log",
                          params: ({ event: { error } }) => ({
                            message: "Error while shutting down GQL server",
                            level: "error",
                            error,
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
          "All services shut down": {
            type: "final",
            entry: {
              type: "log",
              params: {
                message: "All services have been shut down successfully.",
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
