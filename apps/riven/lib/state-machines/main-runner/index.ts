import { type ActorRefFromLogic, enqueueActions, raise, setup } from "xstate";

import { withLogAction } from "../utilities/with-log-action.ts";
import { pluginActor } from "./actors/plugin.actor.js";
import { processRequestedItem } from "./actors/process-requested-item.actor.ts";
import { retryLibraryActor } from "./actors/retry-library.actor.ts";

import type { RetryLibraryEvent } from "../../events/scheduled-tasks.ts";
import type { PendingRunnerInvocationPlugin } from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { PluginToProgramEvent } from "@repo/util-plugin-sdk/plugin-to-program-events";
import type { MediaItemRequestedEvent } from "@repo/util-plugin-sdk/plugin-to-program-events/media-item/requested";
import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";

export interface MainRunnerMachineContext {
  pluginRefs: Map<symbol, ActorRefFromLogic<typeof pluginActor>>;
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
      for (const pluginRef of context.pluginRefs.values()) {
        pluginRef.send(event);
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
      const pluginRefMap = new Map<
        symbol,
        ActorRefFromLogic<typeof pluginActor>
      >();

      for (const [
        pluginSymbol,
        { config, dataSources },
      ] of input.plugins.entries()) {
        const pluginRef = spawn(pluginActor, {
          id: `plugin-runner-${String(pluginSymbol.description)}` as never,
          input: {
            pluginSymbol,
            dataSources,
            hooks: config.hooks,
          },
        });

        pluginRefMap.set(pluginSymbol, pluginRef);
      }

      return {
        pluginRefs: pluginRefMap,
      };
    },
    entry: [
      {
        type: "broadcastToPlugins",
        params: {
          type: "riven.core.started",
        },
      },
      raise({ type: "retry-library" }),
      {
        type: "log",
        params: {
          message: "Riven has started successfully.",
        },
      },
    ],
    on: {
      // TODO: This is overwritten by other events
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
