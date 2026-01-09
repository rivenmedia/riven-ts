import { type ParamsFor, RivenEvent } from "@repo/util-plugin-sdk";
import { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";

import { Queue, Worker } from "bullmq";
import { enqueueActions, raise, setup, toPromise } from "xstate";

import { createWorker } from "../../message-queue/utilities/create-worker.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { persistMovieIndexerData } from "./actors/persist-movie-indexer-data.actor.ts";
import { processRequestedItem } from "./actors/process-requested-item.actor.ts";
import { retryLibraryActor } from "./actors/retry-library.actor.ts";
import { createPluginHookWorkers } from "./utilities/create-plugin-hook-workers.ts";

import type { RetryLibraryEvent } from "../../events/scheduled-tasks.ts";
import type { PendingRunnerInvocationPlugin } from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { PluginToProgramEvent } from "@repo/util-plugin-sdk/plugin-to-program-events";
import type { MediaItemPersistMovieIndexerDataEvent } from "@repo/util-plugin-sdk/plugin-to-program-events/media-item/persist-movie-indexer-data";
import type { MediaItemRequestedEvent } from "@repo/util-plugin-sdk/plugin-to-program-events/media-item/requested";

export interface MainRunnerMachineContext {
  plugins: Map<symbol, PendingRunnerInvocationPlugin>;
  queues: Map<RivenEvent["type"], Queue>;
  processorWorkers: Map<PluginToProgramEvent["type"], Worker>;
  pluginHookWorkers: Map<symbol, Map<RivenEvent["type"], Worker>>;
  publishableEvents: Set<RivenEvent["type"]>;
}

export interface MainRunnerMachineInput {
  plugins: Map<symbol, PendingRunnerInvocationPlugin>;
  queues: Map<RivenEvent["type"], Queue>;
}

export type MainRunnerMachineEvent = RetryLibraryEvent | RivenEvent;

export const mainRunnerMachine = setup({
  types: {
    context: {} as MainRunnerMachineContext,
    input: {} as MainRunnerMachineInput,
    events: {} as MainRunnerMachineEvent,
    children: {} as {
      persistMovieIndexerData: "persistMovieIndexerData";
      processRequestedItem: "processRequestedItem";
    },
  },
  actions: {
    addEventToQueue: (
      { context },
      { type, ...event }: ProgramToPluginEvent,
    ) => {
      const queue = context.queues.get(type);

      if (!queue) {
        throw new Error("Task queue not found");
      }

      void queue.add(type, event);
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
    persistMovieIndexerData: enqueueActions(
      (
        { enqueue, self },
        params: ParamsFor<MediaItemPersistMovieIndexerDataEvent>,
      ) => {
        enqueue.spawnChild(persistMovieIndexerData, {
          input: {
            item: params.item,
            parentRef: self,
          },
        });
      },
    ),
    retryLibrary: enqueueActions(({ enqueue, self }) => {
      enqueue.spawnChild(retryLibraryActor, {
        id: "retry-library-actor" as never,
        input: {
          parentRef: self,
        },
      });
    }),
  },
  actors: {
    persistMovieIndexerData,
    processRequestedItem,
  },
  guards: {
    shouldQueueEvent: ({ event, context }) =>
      event.type.startsWith("riven.") &&
      context.publishableEvents.has(event.type as never),
    isRivenEvent: ({ event }) => RivenEvent.safeParse(event).success,
  },
})
  .extend(withLogAction)
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABABwCcB7KAgQwFscKzVcCBXLLMAgYgI2wDoLJUyAWlQAXMBW4AqANoAGALqJQeIrFGoiWJSAAeiAIwAmADQgAnogCsATmvcAHEcsBfZ6bSZchEuSo06OIzMrBxcWIJ4ADYMUHS8-EKi4twEYACODHBiEHKKSCAqaiIaWvl6CEamFggALJaGDjYAzADsLm4gHtj4xKSU1LT0TCzsnJ7xEALCYhIAxqlkxZrcrMQEudqF6pra5ZXmiE2yltzWsgBshu3uYT0+-f5DwaNhE1NJcwtLWNxkkQsQMyCMA6VCwESwDb5LbfXYGEwHCqWeynSxNJyuG6eO59PyDQLDEJjHipEQEIGRVAAI3I5KhylU21KoD2COqRlcHSwRAgcG0XS8vV8AwCQRGm0ZsLKiDa3FkhhaTRqrUsVRlln03Ba50sl3ariAA */
    id: "Riven program main runner",
    context: ({ input, self, spawn }) => {
      const { pluginWorkers, publishableEvents } = createPluginHookWorkers(
        input.plugins,
        input.queues,
      );

      return {
        plugins: input.plugins,
        queues: input.queues,
        pluginHookWorkers: pluginWorkers,
        publishableEvents,
        processorWorkers: new Map<PluginToProgramEvent["type"], Worker>([
          [
            "riven-plugin.media-item.persist-movie-indexer-data",
            createWorker(
              "riven-plugin.media-item.persist-movie-indexer-data",
              async (job) => {
                const actor = spawn(persistMovieIndexerData, {
                  input: {
                    item: job.data.item,
                    parentRef: self,
                    plugin: job.data.plugin,
                  },
                });

                actor.start();

                return toPromise(actor);
              },
            ),
          ],
          [
            "riven-plugin.media-item.requested",
            createWorker("riven-plugin.media-item.requested", async (job) => {
              const actor = spawn(processRequestedItem, {
                input: {
                  item: job.data.item,
                  parentRef: self,
                  plugin: job.data.plugin,
                },
              });

              actor.start();

              return toPromise(actor);
            }),
          ],
        ]),
      };
    },
    entry: [
      {
        type: "addEventToQueue",
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
    always: [
      {
        guard: "shouldQueueEvent",
        actions: {
          type: "addEventToQueue",
          params: ({ event }) => ProgramToPluginEvent.parse(event),
        },
      },
      {
        guard: "isRivenEvent",
        actions: {
          type: "log",
          params: ({ event }) => ({
            message: `Received event: ${event.type}`,
            level: "silly",
          }),
        },
      },
    ],
    on: {
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
      "riven-plugin.media-item.persist-movie-indexer-data": {
        description:
          "Indicates that a plugin has provided data to be persisted for a media item after indexing a movie.",
        actions: {
          type: "persistMovieIndexerData",
          params: ({ event }) => ({
            item: event.item,
            plugin: event.plugin,
          }),
        },
      },
      "riven.media-item.creation.error": {
        description:
          "Indicates that an error occurred while attempting to create a media item in the library.",
        actions: [
          {
            type: "log",
            params: ({ event }) => ({
              message: `Error creating media item ${JSON.stringify(event.item)}: ${String(event.error)}`,
              level: "error",
            }),
          },
        ],
      },
      "riven.media-item.creation.already-exists": {
        description:
          "Indicates that a media item creation was attempted, but the item already exists in the library.",
        actions: [
          {
            type: "log",
            params: ({ event }) => ({
              message: `Media item already exists: ${JSON.stringify(event.item)}`,
              level: "verbose",
            }),
          },
        ],
      },
      "retry-library": {
        description:
          "Retries processing of any media items that are in a pending state.",
        actions: {
          type: "retryLibrary",
        },
      },
    },
  });
