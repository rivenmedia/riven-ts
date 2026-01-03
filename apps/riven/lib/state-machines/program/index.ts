import { type LogLevel, logger } from "@repo/core-util-logger";
import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  MediaItemRequestedEvent,
  PluginToProgramEvent,
  ProgramToPluginEvent,
} from "@repo/util-plugin-sdk/events";

import type { ApolloServer } from "@apollo/server";
import type { UUID } from "node:crypto";
import { assign, enqueueActions, setup } from "xstate";

import { processRequestedItem } from "../bootstrap/actors/process-requested-item.actor.ts";
import { stopGqlServer } from "../bootstrap/actors/stop-gql-server.actor.ts";
import { bootstrapMachine } from "../bootstrap/index.ts";
import type {
  PendingRunnerInvocationPlugin,
  ValidPlugin,
} from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";

export interface RivenMachineContext {
  plugins?: Map<symbol, ValidPlugin>;
  server?: ApolloServer;
}

export interface RivenMachineInput {
  sessionId: UUID;
}

export type RivenMachineEvent =
  | PluginToProgramEvent
  | ProgramToPluginEvent
  | { type: "START" }
  | { type: "EXIT" };

export const rivenMachine = setup({
  types: {
    context: {} as RivenMachineContext,
    events: {} as RivenMachineEvent,
    input: {} as RivenMachineInput,
    children: {} as {
      bootstrap: "bootstrapMachine";
      processRequestedItem: "processRequestedItem";
      stopGqlServer: "stopGqlServer";
    },
  },
  actions: {
    broadcastToPlugins: ({ context }, event: ProgramToPluginEvent) => {
      if (!context.plugins) {
        logger.warn(
          `Attempted to broadcast ${event.type} with no plugins loaded. ` +
            `Double-check that plugins have been installed.`,
        );

        return;
      }

      for (const { runnerRef } of context.plugins.values()) {
        runnerRef.send(event);
      }
    },
    invokePluginRunners: assign(
      ({ spawn }, plugins: Map<symbol, PendingRunnerInvocationPlugin>) => {
        const pluginMap = new Map<symbol, ValidPlugin>();

        for (const [
          pluginSymbol,
          { config, dataSources },
        ] of plugins.entries()) {
          const pluginRef = spawn(config.runner, {
            input: {
              pluginSymbol,
              dataSources,
            },
          });

          pluginMap.set(pluginSymbol, {
            status: "valid",
            config,
            dataSources,
            runnerRef: pluginRef,
          });
        }

        return {
          plugins: pluginMap,
        };
      },
    ),
    storeGqlServerInstance: assign({
      server: (_, server: ApolloServer) => server,
    }),
    processRequestedItem: enqueueActions(
      ({ enqueue, self }, params: ParamsFor<MediaItemRequestedEvent>) => {
        enqueue.spawnChild(processRequestedItem, {
          input: {
            item: params.item,
            parentRef: self,
          },
        });
      },
    ),
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
    bootstrapMachine,
    processRequestedItem,
    stopGqlServer,
  },
}).createMachine({
  id: "Riven",
  initial: "Idle",
  on: {
    EXIT: ".Shutdown",
  },
  states: {
    Idle: {
      on: {
        START: "Bootstrapping",
      },
    },
    Bootstrapping: {
      invoke: {
        id: "bootstrap",
        src: "bootstrapMachine",
        input: ({ self }) => ({ rootRef: self }),
        onDone: {
          actions: [
            {
              type: "invokePluginRunners",
              params: ({ event }) => event.output.plugins,
            },
            {
              type: "storeGqlServerInstance",
              params: ({ event }) => event.output.server,
            },
          ],
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
      on: {
        "riven.media-item.*": {
          actions: [
            {
              type: "broadcastToPlugins",
              params: ({ event }) => event,
            },
          ],
        },
        "riven-plugin.media-item.requested": {
          actions: {
            type: "processRequestedItem",
            params: ({ event }) => ({
              item: event.item,
              plugin: event.plugin,
            }),
          },
        },
      },
    },
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
