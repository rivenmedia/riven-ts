import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  MediaItemRequestedEvent,
  PluginToProgramEvent,
  ProgramToPluginEvent,
} from "@repo/util-plugin-sdk/events";

import { enqueueActions, setup } from "xstate";

import type {
  PendingRunnerInvocationPlugin,
  ValidPlugin,
} from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { processRequestedItem } from "./actors/process-requested-item.actor.ts";

export interface MainRunnerMachineContext {
  plugins: Map<symbol, ValidPlugin>;
}

export interface MainRunnerMachineInput {
  plugins: Map<symbol, PendingRunnerInvocationPlugin>;
}

export type MainRunnerMachineEvent =
  | PluginToProgramEvent
  | ProgramToPluginEvent;

export const mainRunnerMachine = setup({
  types: {
    context: {} as MainRunnerMachineContext,
    input: {} as MainRunnerMachineInput,
    events: {} as MainRunnerMachineEvent,
  },
  actions: {
    broadcastToPlugins: ({ context }, event: ProgramToPluginEvent) => {
      for (const { runnerRef } of context.plugins.values()) {
        runnerRef.send(event);
      }
    },
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
  },
})
  .extend(withLogAction)
  .createMachine({
    id: "runner",
    context: ({ input, spawn }) => {
      const pluginMap = new Map<symbol, ValidPlugin>();

      for (const [
        pluginSymbol,
        { config, dataSources },
      ] of input.plugins.entries()) {
        const pluginRef = spawn(config.runner, {
          id: `plugin-runner-${String(pluginSymbol.description)}` as never,
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
      "riven.media-item.creation.error": {
        actions: {
          type: "log",
          params: ({ event }) => ({
            message: `Error creating media item ${JSON.stringify(event.item)}: ${String(event.error)}`,
            level: "error",
          }),
        },
      },
      "riven.media-item.creation.already-exists": {
        actions: {
          type: "log",
          params: ({ event }) => ({
            message: `Media item already exists: ${JSON.stringify(event.item)}`,
            level: "verbose",
          }),
        },
      },
    },
  });
