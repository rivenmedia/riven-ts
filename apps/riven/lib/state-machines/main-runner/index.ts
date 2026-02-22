import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { RivenEvent } from "@repo/util-plugin-sdk/events";

import { enqueueActions, raise, setup } from "xstate";

import { downloadItemProcessor } from "../../message-queue/flows/download-item/download-item.processor.ts";
import { DownloadItemFlow } from "../../message-queue/flows/download-item/download-item.schema.ts";
import { findValidTorrentContainerProcessor } from "../../message-queue/flows/download-item/steps/find-valid-torrent-container/find-valid-torrent-container.processor.ts";
import { FindValidTorrentContainerFlow } from "../../message-queue/flows/download-item/steps/find-valid-torrent-container/find-valid-torrent-container.schema.ts";
import { rankStreamsProcessor } from "../../message-queue/flows/download-item/steps/rank-streams/rank-streams.processor.ts";
import { RankStreamsFlow } from "../../message-queue/flows/download-item/steps/rank-streams/rank-streams.schema.ts";
import { indexItemProcessor } from "../../message-queue/flows/index-item/index-item.processor.ts";
import { RequestIndexDataFlow } from "../../message-queue/flows/index-item/index-item.schema.ts";
import { requestContentServicesProcessor } from "../../message-queue/flows/request-content-services/request-content-services.processor.ts";
import { RequestContentServicesFlow } from "../../message-queue/flows/request-content-services/request-content-services.schema.ts";
import { scrapeItemProcessor } from "../../message-queue/flows/scrape-item/scrape-item.processor.ts";
import { ScrapeItemFlow } from "../../message-queue/flows/scrape-item/scrape-item.schema.ts";
import { parseScrapeResultsProcessor } from "../../message-queue/flows/scrape-item/steps/parse-scrape-results/parse-scrape-results.processor.ts";
import { ParseScrapeResultsFlow } from "../../message-queue/flows/scrape-item/steps/parse-scrape-results/parse-scrape-results.schema.ts";
import { createFlowWorker } from "../../message-queue/utilities/create-flow-worker.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { SerialisedItemRequest } from "../../utilities/serialisers/serialised-item-request.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { requestContentServices } from "./actors/request-content-services.actor.ts";
import { requestDownload } from "./actors/request-download.actor.ts";
import { requestIndexData } from "./actors/request-index-data.actor.ts";
import { requestScrape } from "./actors/request-scrape.actor.ts";
import { retryLibrary } from "./actors/retry-library.actor.ts";
import { getPluginEventSubscribers } from "./utilities/get-plugin-event-subscribers.ts";

import type { RivenInternalEvent } from "../../message-queue/events/index.ts";
import type { EnqueueDownloadItemInput } from "../../message-queue/flows/download-item/enqueue-download-item.ts";
import type { EnqueueIndexItemInput } from "../../message-queue/flows/index-item/enqueue-index-item.ts";
import type { Flow } from "../../message-queue/flows/index.ts";
import type { EnqueueScrapeItemInput } from "../../message-queue/flows/scrape-item/enqueue-scrape-item.ts";
import type {
  PluginQueueMap,
  PluginWorkerMap,
  PublishableEventSet,
  ValidPluginMap,
} from "../../types/plugins.ts";
import type { Worker } from "bullmq";
import type z from "zod";

export interface MainRunnerMachineContext {
  plugins: ValidPluginMap;
  flows: {
    [K in Flow["name"]]: Worker<
      Extract<Flow, { name: K }>["input"],
      Extract<Flow, { name: K }>["output"]
    >;
  };
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

export type MainRunnerMachineEvent = RivenInternalEvent | RivenEvent;

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
      { type, ...event }: z.input<typeof RivenEvent>,
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
        enqueue.spawnChild(requestContentServices, {
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
        params: Omit<EnqueueIndexItemInput, "subscribers">,
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
        params: Omit<EnqueueScrapeItemInput, "subscribers">,
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
        params: Omit<EnqueueDownloadItemInput, "subscribers">,
      ) => {
        if (params.item.streams.length === 0) {
          return;
        }

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
    fanOutDownload: enqueueActions(
      (
        { enqueue, context: { plugins } },
        params: Omit<EnqueueDownloadItemInput, "subscribers">,
      ) => {
        if (params.item.streams.length === 0) {
          return;
        }

        const { item } = params;

        if (item instanceof Show) {
          for (const season of item.seasons) {
            enqueue.spawnChild(requestScrape, {
              input: {
                item: season,
                subscribers: getPluginEventSubscribers(
                  "riven.media-item.scrape.requested",
                  plugins,
                ),
              },
            });
          }
        }

        if (item instanceof Season) {
          for (const episode of item.episodes) {
            enqueue.spawnChild(requestScrape, {
              input: {
                item: episode,
                subscribers: getPluginEventSubscribers(
                  "riven.media-item.scrape.requested",
                  plugins,
                ),
              },
            });
          }
        }
      },
    ),
    retryLibrary: enqueueActions(({ enqueue, self }) => {
      enqueue.spawnChild(retryLibrary, {
        input: {
          parentRef: self,
        },
      });
    }),
  },
  actors: {
    requestContentServices,
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
        flows: {
          "index-item": createFlowWorker(
            RequestIndexDataFlow,
            indexItemProcessor,
            self.send,
          ),
          "request-content-services": createFlowWorker(
            RequestContentServicesFlow,
            requestContentServicesProcessor,
            self.send,
          ),
          "scrape-item": createFlowWorker(
            ScrapeItemFlow,
            scrapeItemProcessor,
            self.send,
          ),
          "scrape-item.parse-scrape-results": createFlowWorker(
            ParseScrapeResultsFlow,
            parseScrapeResultsProcessor,
            self.send,
          ),
          "download-item": createFlowWorker(
            DownloadItemFlow,
            downloadItemProcessor,
            self.send,
          ),
          "download-item.find-valid-torrent-container": createFlowWorker(
            FindValidTorrentContainerFlow,
            findValidTorrentContainerProcessor,
            self.send,
          ),
          "download-item.rank-streams": createFlowWorker(
            RankStreamsFlow,
            rankStreamsProcessor,
            self.send,
          ),
        },
      };
    },
    entry: [
      {
        type: "broadcastEventToPlugins",
        params: { type: "riven.core.started" },
      },
      { type: "requestContentServices" },
      raise({ type: "riven-internal.retry-library" }),
      {
        type: "log",
        params: { message: "Riven has started successfully." },
      },
    ],
    always: [
      {
        guard: "shouldQueueEvent",
        actions: {
          type: "broadcastEventToPlugins",
          params: ({ event }) => RivenEvent.encode(event as never),
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
      /**
       * Item request lifecycle events
       */

      "riven.item-request.creation.success": {
        description:
          "Indicates that a media item has been successfully created in the library.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully created item request: [${item.externalIdsLabel.join(" | ")}]`,
              level: "silly",
            }),
          },
          {
            type: "requestIndexData",
            params: ({ event: { item } }) => ({ item }),
          },
        ],
      },

      "riven.item-request.creation.error": {
        description:
          "Indicates that an error occurred while attempting to create an item request.",
        actions: [
          {
            type: "log",
            params: ({ event: { item, error } }) => ({
              message: `Error creating item request ${JSON.stringify(SerialisedItemRequest.decode(item))}: ${String(error)}`,
              level: "error",
            }),
          },
        ],
      },

      "riven.item-request.creation.error.conflict": {
        description:
          "Indicates that an item request creation was attempted, but the item already exists in the library.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Item request already exists: ${JSON.stringify(SerialisedItemRequest.decode(item))}`,
              level: "verbose",
            }),
          },
        ],
      },

      /**
       * Index lifecycle events
       */

      "riven.media-item.index.requested": {
        description:
          "Indicates that a media item index has been requested for a media item.",
        actions: {
          type: "requestIndexData",
          params: ({ event: { item } }) => ({ item }),
        },
      },

      "riven.media-item.index.success": {
        description:
          "Indicates that a media item has been successfully indexed in the library.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully indexed ${item.type}: ${item.title}`,
              level: "info",
            }),
          },
          {
            type: "requestScrape",
            params: ({ event: { item } }) => ({ item }),
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
              message: `Media item has already been indexed: ${JSON.stringify(SerialisedItemRequest.decode(item))}`,
              level: "verbose",
            }),
          },
        ],
      },

      /**
       * Scrape lifecycle events
       */

      "riven.media-item.scrape.requested": {
        description:
          "Indicates that a media item scrape has been requested for an indexed media item.",
        actions: {
          type: "requestScrape",
          params: ({ event: { item } }) => ({ item }),
        },
      },

      "riven.media-item.scrape.success": {
        description:
          "Indicates that a media item has been successfully scraped.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully scraped ${item.type}: ${item.title}`,
              level: "info",
            }),
          },
          {
            type: "requestDownload",
            params: ({ event: { item } }) => ({ item }),
          },
        ],
      },

      /**
       * Download lifecycle events
       */

      "riven.media-item.download.success": {
        description:
          "Indicates that a media item has been successfully downloaded.",
        actions: [
          {
            type: "log",
            params: ({
              event: {
                item: { title },
                durationFromRequestToDownload,
              },
            }) => ({
              message: `Successfully downloaded ${title} in ${durationFromRequestToDownload.toString()} seconds.`,
            }),
          },
        ],
      },

      "riven.media-item.download.error": {
        description:
          "Indicates that an error occurred during the download process for a media item.",
        actions: [
          {
            type: "log",
            params: ({ event: { item, error } }) => ({
              message: `Error downloading ${item.title}: ${String(error)}`,
              level: "error",
            }),
          },
          {
            type: "fanOutDownload",
            params: ({ event: { item } }) => ({ item }),
          },
        ],
      },

      /**
       * Internal events
       */

      "riven-internal.retry-library": {
        description: "Retries any incomplete media items and item requests.",
        actions: { type: "retryLibrary" },
      },

      "riven-internal.retry-item-download": {
        description: "Retries the download process for a scraped media item.",
        actions: {
          type: "requestDownload",
          params: ({ event: { item } }) => ({
            item,
          }),
        },
      },
    },
  });

export type MainRunnerMachineIntake = (event: MainRunnerMachineEvent) => void;
