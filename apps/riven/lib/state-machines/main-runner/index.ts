import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  MediaItemRequestedEvent,
  PluginToProgramEvent,
  ProgramToPluginEvent,
  RetryLibraryEvent,
} from "@repo/util-plugin-sdk/events";

import { enqueueActions, raise, setup } from "xstate";

import type {
  PendingRunnerInvocationPlugin,
  ValidPlugin,
} from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { processRequestedItem } from "./actors/process-requested-item.actor.ts";
import { retryLibraryActor } from "./actors/retry-library.actor.ts";

export interface MainRunnerMachineContext {
  plugins: Map<symbol, ValidPlugin>;
}

export interface MainRunnerMachineInput {
  plugins: Map<symbol, PendingRunnerInvocationPlugin>;
}

export type MainRunnerMachineEvent =
  | RetryLibraryEvent
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
    retryLibrary: enqueueActions(({ enqueue, self }) => {
      enqueue.spawnChild(retryLibraryActor, {
        input: {
          parentRef: self,
        },
      });
    }),
  },
})
  .extend(withLogAction)
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABABwCcB7KAgQwFscKzVcCBXLLMAgYgI2wDoLJUyAWlQAXMBW4AqANoAGALqJQeIrFGoiWJSAAeiAIwAmADQgAnogCsATmvcAHEcsBfZ6bSZchEuSo06OIzMrBxcWIJ4ADYMUHS8-EKi4twEYACODHBiEHKKSCAqaiIaWvl6CEamFggALJaGDjYAzADsLm4gHtj4xKSU1LT0TCzsnJ7xEALCYhIAxqlkxZrcrMQEudqF6pra5ZXmiE2yltzWsgBshu3uYT0+-f5DwaNhE1NJcwtLWNxkkQsQMyCMA6VCwESwDb5LbfXYGEwHCqWeynSxNJyuG6eO59PyDQLDEJjHipEQEIGRVAAI3I5KhylU21KoD2COqRlcHSwRAgcG0XS8vV8AwCQRGm0ZsLKiDa3FkhhaTRqrUsVRlln03Ba50sl3ariAA */
    id: "Riven program main runner",
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
      raise({ type: "riven.retry-library" }),
      {
        type: "log",
        params: {
          message: "Riven has started successfully.",
        },
      },
    ],
    on: {
      "riven.media-item.*": {
        description:
          "Broadcasts any media item related events to all registered plugins.",
        actions: [
          {
            type: "broadcastToPlugins",
            params: ({ event }) => event,
          },
        ],
      },
      "riven-plugin.media-item.requested": {
        description:
          "Indicates that a plugin has requested the creation of a media item in the library.",
        actions: {
          type: "processRequestedItem",
          params: ({ event }) => ({
            item: event.item,
            plugin: event.plugin,
          }),
        },
      },
      "riven.media-item.creation.error": {
        description:
          "Indicates that an error occurred while attempting to create a media item in the library.",
        actions: {
          type: "log",
          params: ({ event }) => ({
            message: `Error creating media item ${JSON.stringify(event.item)}: ${String(event.error)}`,
            level: "error",
          }),
        },
      },
      "riven.media-item.creation.already-exists": {
        description:
          "Indicates that a media item creation was attempted, but the item already exists in the library.",
        actions: {
          type: "log",
          params: ({ event }) => ({
            message: `Media item already exists: ${JSON.stringify(event.item)}`,
            level: "verbose",
          }),
        },
      },
      "riven.retry-library": {
        description:
          "Retries processing of any media items that are in a pending state.",
        actions: {
          type: "retryLibrary",
        },
      },
    },
  });
