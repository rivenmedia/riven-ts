import {
  type ActorRefFromLogic,
  createActor,
  enqueueActions,
  setup,
} from "xstate";

import {
  type BootstrapMachineOutput,
  bootstrapMachine,
} from "../bootstrap/index.ts";
import { mainRunnerMachine } from "../main-runner/index.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { shutdown } from "./actors/shutdown.actor.ts";
import { stopGqlServer } from "./actors/stop-gql-server.actor.ts";
import { unmountVfs } from "./actors/unmount-vfs.actor.ts";

import type { ApolloServerContext } from "../../graphql/context.ts";
import type { ValidPluginMap } from "../../types/plugins.ts";
import type { SessionID } from "../../utilities/logger/session-id.ts";
import type { ApolloServer } from "@apollo/server";
import type { CoreShutdownEvent } from "@repo/util-plugin-sdk/schemas/events/core.shutdown.event";
import type Fuse from "@zkochan/fuse-native";

export interface RivenMachineContext {
  mainRunnerRef: ActorRefFromLogic<typeof mainRunnerMachine>;
  plugins?: ValidPluginMap;
  server?: ApolloServer<ApolloServerContext>;
  vfs?: Fuse;
}

export interface RivenMachineInput {
  sessionId: SessionID;
}

export type RivenMachineEvent = CoreShutdownEvent | { type: "BOOTSTRAP" };

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
  actions: {
    handleBootstrapComplete: enqueueActions(
      (
        { enqueue, context: { mainRunnerRef } },
        {
          pluginQueues,
          pluginWorkers,
          plugins,
          publishableEvents,
          server,
          vfs,
        }: BootstrapMachineOutput,
      ) => {
        enqueue.assign({ vfs, server });
        enqueue.sendTo(mainRunnerRef, {
          type: "START",
          input: {
            pluginQueues,
            pluginWorkers,
            plugins,
            publishableEvents,
          },
        });
      },
    ),
  },
})
  .extend(withLogAction)
  .createMachine({
    id: "Riven",
    initial: "Idle",
    context: ({ self, spawn }) => ({
      mainRunnerRef: spawn("mainRunnerMachine", {
        id: "mainRunnerMachine",
        input: {
          parentRef: self,
        },
      }),
    }),
    on: {
      "riven.core.shutdown": ".Shutdown",
    },
    states: {
      Idle: {
        on: {
          BOOTSTRAP: "Bootstrapping",
        },
      },
      Bootstrapping: {
        invoke: {
          id: "bootstrapMachine",
          src: "bootstrapMachine",
          input: ({ context: { mainRunnerRef }, self }) => ({
            mainRunnerRef,
            rootRef: self,
          }),
          onDone: {
            target: "Running",
            actions: {
              type: "handleBootstrapComplete",
              params: ({ event: { output } }) => output,
            },
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
      },
    },
  });

export function createRivenMachine(input: RivenMachineInput) {
  return createActor(rivenMachine, { input });
}
