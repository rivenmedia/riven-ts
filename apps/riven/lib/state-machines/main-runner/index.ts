import { logger } from "@repo/core-util-logger";
import { RivenEvent } from "@repo/util-plugin-sdk/events";

import { Worker } from "bullmq";
import { enqueueActions, raise, setup } from "xstate";

import { downloadItemProcessor } from "../../message-queue/flows/download-item/download-item.processor.ts";
import { indexItemProcessor } from "../../message-queue/flows/index-item/index-item.processor.ts";
import { requestContentServicesProcessor } from "../../message-queue/flows/request-content-services/request-content-services.processor.ts";
import { scrapeItemProcessor } from "../../message-queue/flows/scrape-item/scrape-item.processor.ts";
import { sortScrapeResultsProcessor } from "../../message-queue/flows/scrape-item/steps/sort-scrape-results.processor.ts";
import { createFlowWorker } from "../../message-queue/utilities/create-flow-worker.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { requestContentServicesActor } from "./actors/request-content-services.actor.ts";
import { requestDownload } from "./actors/request-download.actor.ts";
import { requestIndexData } from "./actors/request-index-data.actor.ts";
import { requestScrape } from "./actors/request-scrape.actor.ts";
import { retryLibraryActor } from "./actors/retry-library.actor.ts";
import { getPluginEventSubscribers } from "./utilities/get-plugin-event-subscribers.ts";

import type { RetryLibraryEvent } from "../../message-queue/events/retry-library.event.ts";
import type { Flow } from "../../message-queue/flows/index.ts";
import type {
  PluginQueueMap,
  PluginWorkerMap,
  PublishableEventSet,
  ValidPluginMap,
} from "../../types/plugins.ts";
import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

export interface MainRunnerMachineContext {
  plugins: ValidPluginMap;
  flows: Map<Flow["name"], Worker>;
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
  publishableEvents: PublishableEventSet;
}

export interface MainRunnerMachineInput {
  plugins: ValidPluginMap;
  publishableEvents: PublishableEventSet;
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
}

export type MainRunnerMachineEvent = RetryLibraryEvent | RivenEvent;

export const mainRunnerMachine = setup({
  types: {
    context: {} as MainRunnerMachineContext,
    input: {} as MainRunnerMachineInput,
    events: {} as MainRunnerMachineEvent,
    children: {} as {
      requestContentServices: "requestContentServices";
    },
  },
  actions: {
    broadcastEventToPlugins: (
      { context: { plugins, pluginQueues } },
      { type, ...event }: RivenEvent,
    ) => {
      for (const plugin of plugins.values()) {
        const queue = pluginQueues.get(plugin.config.name)?.get(type);

        if (!queue) {
          continue;
        }

        logger.silly(
          `Broadcasting event "${type}" to plugin "${
            plugin.config.name.description ?? "unknown"
          }"`,
        );

        void queue.add(type, event);
      }
    },
    requestContentServices: enqueueActions(
      ({ enqueue, context: { plugins } }) => {
        enqueue.spawnChild(requestContentServicesActor, {
          input: {
            subscribers: getPluginEventSubscribers(
              "riven.content-service.requested",
              plugins,
            ),
          },
        });
      },
    ),
    requestIndexData: enqueueActions(
      (
        { enqueue, context: { plugins } },
        params: ParamsFor<MediaItemIndexRequestedEvent>,
      ) => {
        enqueue.spawnChild(requestIndexData, {
          input: {
            item: params.item,
            subscribers: getPluginEventSubscribers(
              "riven.media-item.index.requested",
              plugins,
            ),
          },
        });
      },
    ),
    requestScrape: enqueueActions(
      (
        { enqueue, context: { plugins } },
        params: ParamsFor<MediaItemScrapeRequestedEvent>,
      ) => {
        enqueue.spawnChild(requestScrape, {
          input: {
            item: params.item,
            subscribers: getPluginEventSubscribers(
              "riven.media-item.scrape.requested",
              plugins,
            ),
          },
        });
      },
    ),
    requestDownload: enqueueActions(
      (
        { enqueue, context: { plugins } },
        params: ParamsFor<MediaItemScrapeRequestedEvent>,
      ) => {
        enqueue.spawnChild(requestDownload, {
          input: {
            item: params.item,
            subscribers: getPluginEventSubscribers(
              "riven.media-item.download.requested",
              plugins,
            ),
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
  actors: {
    requestContentServices: requestContentServicesActor,
    requestIndexData,
    requestScrape,
  },
  guards: {
    /**
     * Not all events should be broadcast to plugins - only those that have registered hooks.
     * Otherwise, events build up in the queue and may be unintentionally processed later, when a hook is registered.
     *
     * @returns boolean
     */
    shouldQueueEvent: ({ event, context: { publishableEvents } }) => {
      const parsedEvent = RivenEvent.safeParse(event);

      if (!parsedEvent.success) {
        return false;
      }

      const isPublishableEvent = publishableEvents.has(parsedEvent.data.type);

      if (!isPublishableEvent) {
        logger.silly(
          `Event "${parsedEvent.data.type}" will not be queued, as no plugins have registered hooks for it.`,
        );
      }

      return isPublishableEvent;
    },
    isRivenEvent: ({ event }) => RivenEvent.safeParse(event).success,
  },
})
  .extend(withLogAction)
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABABwCcB7KAgQwFscKzVcCBXLLMAgYgI2wDoLJUyAWlQAXMBW4AqANoAGALqJQeIrFGoiWJSAAeiAIwAmADQgAnogCsATmvcAHEcsBfZ6bSZchEuSo06OIzMrBxcWIJ4ADYMUHS8-EKi4twEYACODHBiEHKKSCAqaiIaWvl6CEamFggALJaGDjYAzADsLm4gHtj4xKSU1LT0TCzsnJ7xEALCYhIAxqlkxZrcrMQEudqF6pra5ZXmiE2yltzWsgBshu3uYT0+-f5DwaNhE1NJcwtLWNxkkQsQMyCMA6VCwESwDb5LbfXYGEwHCqWeynSxNJyuG6eO59PyDQLDEJjHipEQEIGRVAAI3I5KhylU21KoD2COqRlcHSwRAgcG0XS8vV8AwCQRGm0ZsLKiDa3FkhhaTRqrUsVRlln03Ba50sl3ariAA */
    id: "Riven program main runner",
    context: ({ input, self }) => {
      return {
        plugins: input.plugins,
        publishableEvents: input.publishableEvents,
        pluginQueues: input.pluginQueues,
        pluginWorkers: input.pluginWorkers,
        flows: new Map<Flow["name"], Worker>([
          [
            "index-item",
            createFlowWorker("index-item", indexItemProcessor, self.send),
          ],
          [
            "request-content-services",
            createFlowWorker(
              "request-content-services",
              requestContentServicesProcessor,
              self.send,
            ),
          ],
          [
            "scrape-item",
            createFlowWorker("scrape-item", scrapeItemProcessor, self.send),
          ],
          [
            "sort-scrape-results",
            createFlowWorker(
              "sort-scrape-results",
              sortScrapeResultsProcessor,
              self.send,
            ),
          ],
          [
            "download-item",
            createFlowWorker("download-item", downloadItemProcessor, self.send),
          ],
        ]),
      };
    },
    entry: [
      {
        type: "broadcastEventToPlugins",
        params: {
          type: "riven.core.started",
        },
      },
      { type: "requestContentServices" },
      raise({ type: "riven-internal.retry-library" }),
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
          type: "broadcastEventToPlugins",
          params: ({ event }) => RivenEvent.parse(event),
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
      "riven.media-item.creation.success": {
        description:
          "Indicates that a media item has been successfully created in the library.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully created media item: ${JSON.stringify(item)}`,
              level: "silly",
            }),
          },
          {
            type: "requestIndexData",
            params: ({ event: { item } }) => ({
              item,
            }),
          },
        ],
      },
      "riven.media-item.index.requested": {
        actions: {
          type: "requestIndexData",
          params: ({ event: { item } }) => ({
            item,
          }),
        },
      },
      "riven.media-item.index.success": {
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully indexed media item: ${JSON.stringify(item)}`,
              level: "info",
            }),
          },
          {
            type: "requestScrape",
            params: ({ event: { item } }) => ({
              item,
            }),
          },
        ],
      },
      "riven.media-item.scrape.requested": {
        actions: {
          type: "requestScrape",
          params: ({ event: { item } }) => ({
            item,
          }),
        },
      },
      "riven.media-item.scrape.success": {
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully scraped media item: ${JSON.stringify(item)}`,
              level: "info",
            }),
          },
          {
            type: "requestDownload",
            params: ({ event: { item } }) => ({
              item,
            }),
          },
        ],
      },
      "riven.media-item.download.requested": {
        actions: {
          type: "requestDownload",
          params: ({ event: { item } }) => ({
            item,
          }),
        },
      },
      "riven.media-item.download.success": {
        actions: [
          {
            type: "log",
            params: ({
              event: {
                item: { title },
                durationFromRequestToDownload,
              },
            }) => ({
              message: `Successfully downloaded ${title ?? "Unknown"} in ${durationFromRequestToDownload.toString()} seconds.`,
            }),
          },
        ],
      },
      "riven.media-item.download.error": {
        actions: [
          {
            type: "log",
            params: ({ event: { item, error } }) => ({
              message: `Error downloading media item ${JSON.stringify(item)}: ${String(error)}`,
              level: "error",
            }),
          },
        ],
      },
      "riven.media-item.creation.error": {
        description:
          "Indicates that an error occurred while attempting to create a media item in the library.",
        actions: [
          {
            type: "log",
            params: ({ event: { item, error } }) => ({
              message: `Error creating media item ${JSON.stringify(item)}: ${String(error)}`,
              level: "error",
            }),
          },
        ],
      },
      "riven.media-item.creation.error.conflict": {
        description:
          "Indicates that a media item creation was attempted, but the item already exists in the library.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Media item already exists: ${JSON.stringify(item)}`,
              level: "verbose",
            }),
          },
        ],
      },
      "riven.media-item.index.error.incorrect-state": {
        description:
          "Indicates that a media item index was attempted, but the item was already indexed in the library.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Media item has already been indexed: ${JSON.stringify(item)}`,
              level: "verbose",
            }),
          },
        ],
      },
      "riven-internal.retry-library": {
        description:
          "Retries processing of any media items that are in a pending state.",
        actions: {
          type: "retryLibrary",
        },
      },
    },
  });

export type MainRunnerMachineIntake = (event: MainRunnerMachineEvent) => void;
