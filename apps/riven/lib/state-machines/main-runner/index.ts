import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";
import { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";

import { Queue, Worker } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import os from "node:os";
import { enqueueActions, raise, setup } from "xstate";
import z from "zod";

import { withLogAction } from "../utilities/with-log-action.ts";
import { persistMovieIndexerData } from "./actors/persist-movie-indexer-data.actor.ts";
import { processRequestedItem } from "./actors/process-requested-item.actor.ts";
import { retryLibraryActor } from "./actors/retry-library.actor.ts";

import type { RetryLibraryEvent } from "../../events/scheduled-tasks.ts";
import type { PendingRunnerInvocationPlugin } from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { ParamsFor, RivenEvent } from "@repo/util-plugin-sdk";
import type { MediaItemPersistMovieIndexerDataEvent } from "@repo/util-plugin-sdk/plugin-to-program-events/media-item/persist-movie-indexer-data";
import type { MediaItemRequestedEvent } from "@repo/util-plugin-sdk/plugin-to-program-events/media-item/requested";

export interface MainRunnerMachineContext {
  plugins: Map<symbol, PendingRunnerInvocationPlugin>;
  queues: Map<RivenEvent["type"], Queue>;
  workers: Map<RivenEvent["type"], Worker>;
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
  },
  actions: {
    addEventToQueue: ({ context }, event: ProgramToPluginEvent) => {
      const queue = context.queues.get(event.type);

      if (!queue) {
        throw new Error("Task queue not found");
      }

      void queue.add(event.type, { event });
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
  guards: {
    shouldQueueEvent: ({ event }) => event.type.startsWith("riven."),
  },
})
  .extend(withLogAction)
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABABwCcB7KAgQwFscKzVcCBXLLMAgYgI2wDoLJUyAWlQAXMBW4AqANoAGALqJQeIrFGoiWJSAAeiAIwAmADQgAnogCsATmvcAHEcsBfZ6bSZchEuSo06OIzMrBxcWIJ4ADYMUHS8-EKi4twEYACODHBiEHKKSCAqaiIaWvl6CEamFggALJaGDjYAzADsLm4gHtj4xKSU1LT0TCzsnJ7xEALCYhIAxqlkxZrcrMQEudqF6pra5ZXmiE2yltzWsgBshu3uYT0+-f5DwaNhE1NJcwtLWNxkkQsQMyCMA6VCwESwDb5LbfXYGEwHCqWeynSxNJyuG6eO59PyDQLDEJjHipEQEIGRVAAI3I5KhylU21KoD2COqRlcHSwRAgcG0XS8vV8AwCQRGm0ZsLKiDa3FkhhaTRqrUsVRlln03Ba50sl3ariAA */
    id: "Riven program main runner",
    context: ({ input }) => {
      const workerMap = new Map<ProgramToPluginEvent["type"], Worker>();

      for (const [
        pluginSymbol,
        { config, dataSources },
      ] of input.plugins.entries()) {
        for (const [eventName, hook] of Object.entries(config.hooks)) {
          if (hook) {
            const worker = new Worker<{ event: ProgramToPluginEvent }>(
              eventName,
              async (job) => {
                const result = await hook({
                  event: job.data.event as never,
                  dataSources,
                  publishEvent: async ({ type, ...event }) => {
                    const queueForEvent = input.queues.get(type);

                    if (!queueForEvent) {
                      throw new Error(`Event queue for ${type} not found`);
                    }

                    await queueForEvent.add(type, { event });
                  },
                });

                return {
                  plugin: pluginSymbol,
                  result,
                };
              },
              {
                concurrency: os.availableParallelism(),
                connection: {
                  url: z.url().parse(process.env["REDIS_URL"]),
                },
                telemetry: new BullMQOtel(
                  `riven-plugin-${pluginSymbol.description ?? "unknown"}`,
                ),
              },
            );

            registerMQListeners(worker);

            logger.debug(
              `Registered worker for event "${eventName}" for plugin ${String(
                pluginSymbol.description,
              )}`,
            );

            workerMap.set(eventName as ProgramToPluginEvent["type"], worker);
          }
        }
      }

      return {
        plugins: input.plugins,
        queues: input.queues,
        workers: workerMap,
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
    always: {
      guard: "shouldQueueEvent",
      actions: {
        type: "addEventToQueue",
        params: ({ event }) => ProgramToPluginEvent.parse(event),
      },
    },
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
