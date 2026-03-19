import { type MediaItem, Show } from "@repo/util-plugin-sdk/dto/entities";
import { RivenEvent } from "@repo/util-plugin-sdk/events";

import { DateTime } from "luxon";
import {
  type ActorRef,
  type Snapshot,
  assign,
  enqueueActions,
  raise,
  setup,
} from "xstate";

import { flow } from "../../message-queue/flows/producer.ts";
import { extractPluginNameFromJobId } from "../../message-queue/utilities/extract-plugin-name-from-job-id.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { SerialisedItemRequest } from "../../utilities/serialisers/serialised-item-request.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import {
  type BootstrapFlowWorkersOutput,
  bootstrapFlowWorkers,
} from "./actors/bootstrap-flow-workers.actor.ts";
import { eventScheduler } from "./actors/event-scheduler.actor.ts";
import {
  type FanOutDownloadInput,
  fanOutDownload,
} from "./actors/fan-out-download.actor.ts";
import { requestContentServices } from "./actors/request-content-services.actor.ts";
import { requestDownload } from "./actors/request-download.actor.ts";
import { requestIndexData } from "./actors/request-index-data.actor.ts";
import { requestScrape } from "./actors/request-scrape.actor.ts";
import { retryLibrary } from "./actors/retry-library.actor.ts";
import {
  type ScheduleReindexInput,
  scheduleReindex,
} from "./actors/schedule-reindex.actor.ts";
import { getPluginEventSubscribers } from "./utilities/get-plugin-event-subscribers.ts";

import type { RivenInternalEvent } from "../../message-queue/events/index.ts";
import type { EnqueueDownloadItemInput } from "../../message-queue/flows/download-item/enqueue-download-item.ts";
import type { EnqueueIndexItemInput } from "../../message-queue/flows/index-item/enqueue-index-item.ts";
import type { EnqueueScrapeItemInput } from "../../message-queue/flows/scrape-item/enqueue-scrape-items.ts";
import type {
  PluginQueueMap,
  PluginWorkerMap,
  PublishableEventSet,
  ValidPluginMap,
} from "../../types/plugins.ts";
import type { RivenMachineEvent } from "../program/index.ts";
import type { FlowJob } from "bullmq";
import type z from "zod";

export interface MainRunnerMachineContext {
  parentRef: ActorRef<Snapshot<unknown>, RivenMachineEvent>;
  plugins: ValidPluginMap;
  flows: BootstrapFlowWorkersOutput | null;
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
  publishableEvents: PublishableEventSet;
}

export interface MainRunnerMachineInput {
  parentRef: ActorRef<Snapshot<unknown>, RivenMachineEvent>;
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
      bootstrapFlowWorkers: "bootstrapFlowWorkers";
      requestContentServices: "requestContentServices";
      requestIndexData: "requestIndexData";
      requestScrape: "requestScrape";
      fanOutDownload: "fanOutDownload";
    },
  },
  actions: {
    broadcastEventToPlugins: (
      { context: { plugins, pluginQueues } },
      { type, ...event }: z.input<typeof RivenEvent>,
    ) => {
      const jobs = plugins.values().reduce<FlowJob[]>((acc, plugin) => {
        const queue = pluginQueues.get(plugin.config.name)?.get(type);

        if (!queue) {
          logger.silly(
            `No queue found for event "${type}" and plugin "${plugin.config.name.description ?? "unknown"}". Event will not be broadcast to this plugin.`,
          );

          return acc;
        }

        return [
          ...acc,
          {
            name: type,
            queueName: queue.name,
            data: event,
          },
        ];
      }, [] as FlowJob[]);

      if (jobs.length === 0) {
        logger.silly(
          `No plugins have registered hooks for event "${type}". Event will not be broadcast to any plugins.`,
        );

        return;
      }

      logger.debug(
        `Enqueuing event "${type}" for ${jobs.map((job) => extractPluginNameFromJobId(job.queueName)).join(", ")} plugin(s).`,
      );

      void flow.addBulk(jobs);
    },
    handleGracefulShutdown: ({ context }) => {
      context.parentRef.send({
        type: "riven.core.shutdown",
      });
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
    scheduleReindex: enqueueActions(
      (
        { enqueue, context: { plugins } },
        params: Omit<ScheduleReindexInput, "subscribers">,
      ) => {
        enqueue.spawnChild(scheduleReindex, {
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
            items: params.items,
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
        params: Omit<FanOutDownloadInput, "subscribers">,
      ) => {
        enqueue.spawnChild(fanOutDownload, {
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
    retryLibrary: enqueueActions(({ enqueue, self }) => {
      enqueue.spawnChild(retryLibrary, {
        input: {
          parentRef: self,
        },
      });
    }),
  },
  actors: {
    bootstrapFlowWorkers,
    createEventScheduler: eventScheduler,
    requestContentServices,
    requestIndexData,
    requestScrape,
    requestDownload,
    fanOutDownload,
    retryLibrary,
    scheduleReindex,
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
    isOngoingItem: (_, item: MediaItem) => item.state === "ongoing",
    isUnreleasedItem: (_, item: MediaItem) => item.state === "unreleased",
    isCompletedItem: (_, item: MediaItem) => {
      if (item instanceof Show) {
        return item.status === "ended";
      }

      return (
        item.releaseDate != null &&
        DateTime.fromJSDate(item.releaseDate) <= DateTime.utc()
      );
    },
  },
})
  .extend(withLogAction)
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABABwCcB7KAgQwFscKzVcCBXLLMAgYgI2wDoLJUyAWlQAXMBW4AqANoAGALqJQeIrFGoiWJSAAeiAIwAmADQgAnogCsATmvcAHEcsBfZ6bSZchEuSo06OIzMrBxcWIJ4ADYMUHS8-EKi4twEYACODHBiEHKKSCAqaiIaWvl6CEamFggALJaGDjYAzADsLm4gHtj4xKSU1LT0TCzsnJ7xEALCYhIAxqlkxZrcrMQEudqF6pra5ZXmiE2yltzWsgBshu3uYT0+-f5DwaNhE1NJcwtLWNxkkQsQMyCMA6VCwESwDb5LbfXYGEwHCqWeynSxNJyuG6eO59PyDQLDEJjHipEQEIGRVAAI3I5KhylU21KoD2COqRlcHSwRAgcG0XS8vV8AwCQRGm0ZsLKiDa3FkhhaTRqrUsVRlln03Ba50sl3ariAA */
    id: "Riven program main runner",
    context: ({ input }) => ({
      parentRef: input.parentRef,
      plugins: input.plugins,
      publishableEvents: input.publishableEvents,
      pluginQueues: input.pluginQueues,
      pluginWorkers: input.pluginWorkers,
      flows: null,
    }),
    initial: "Bootstrapping flow workers",
    on: {
      /**
       * Item request lifecycle events
       */

      "riven.item-request.create.success": {
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

      "riven.item-request.create.error": {
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

      "riven.item-request.create.error.conflict": {
        description:
          "Indicates that an item request creation was attempted, but the item already exists in the library.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Skipping existing item request: ${JSON.stringify(SerialisedItemRequest.decode(item).externalIdsLabel.join(" | "))}`,
              level: "verbose",
            }),
          },
        ],
      },

      "riven.item-request.update.success": {
        description:
          "Indicates that an item request has been successfully updated.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully updated item request: [${item.externalIdsLabel.join(" | ")}]`,
              level: "silly",
            }),
          },
          {
            type: "requestScrape",
            params: ({ event: { item } }) => ({
              items: item.requestedItems.filter(
                (item) => item.state === "indexed" && item.type === "season",
              ),
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

      "riven.media-item.index.success": [
        {
          description:
            "Indicates that a media item has been successfully indexed, but is not yet released. It will be scheduled for re-indexing at a later date.",
          guard: {
            type: "isUnreleasedItem",
            params: ({ event: { item } }) => item,
          },
          actions: [
            {
              type: "scheduleReindex",
              params: ({ event: { item } }) => ({ item }),
            },
            {
              type: "log",
              params: ({ event: { item } }) => ({
                message: `Successfully indexed ${item.type}: ${item.fullTitle}. This item is not yet released and will be scheduled for re-indexing at a later date.`,
                level: "info",
              }),
            },
          ],
        },
        {
          description:
            "Indicates that a media item is partially released and should be scraped & be scheduled for re-indexing at a later date.",
          guard: {
            type: "isOngoingItem",
            params: ({ event: { item } }) => item,
          },
          actions: [
            {
              type: "requestScrape",
              params: ({ event: { item } }) => ({ items: [item] }),
            },
            {
              type: "scheduleReindex",
              params: ({ event: { item } }) => ({ item }),
            },
            {
              type: "log",
              params: ({ event: { item } }) => ({
                message: `Successfully indexed ${item.type}: ${item.fullTitle}. Attempting to download all available episodes; future episodes will be re-indexed after their air date.`,
                level: "info",
              }),
            },
          ],
        },
        {
          description:
            "Indicates that a media item is completely released and should be scraped with no re-indexing scheduled.",
          guard: {
            type: "isCompletedItem",
            params: ({ event: { item } }) => item,
          },
          actions: [
            {
              type: "requestScrape",
              params: ({ event: { item } }) => ({ items: [item] }),
            },
            {
              type: "log",
              params: ({ event: { item } }) => ({
                message: `Successfully indexed ${item.type}: ${item.fullTitle}`,
                level: "info",
              }),
            },
          ],
        },
        {
          actions: {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully indexed ${item.type}: ${item.fullTitle}, but could not determine the next action.`,
              level: "error",
            }),
          },
        },
      ],

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
          params: ({ event: { item } }) => ({ items: [item] }),
        },
      },

      "riven.media-item.scrape.error.no-new-streams": {
        description:
          "Indicates that a media item scrape completed successfully, but no new streams were found.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `No new streams found for ${item.fullTitle}.`,
              level: "verbose",
            }),
          },
          {
            type: "fanOutDownload",
            params: ({ event: { item } }) => ({ item }),
          },
        ],
      },

      "riven.media-item.scrape.success": {
        description:
          "Indicates that a media item has been successfully scraped.",
        actions: [
          {
            type: "log",
            params: ({ event: { item } }) => ({
              message: `Successfully scraped ${item.type}: ${item.fullTitle}`,
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
                downloader,
                item: { fullTitle },
                durationFromRequestToDownload,
                provider,
              },
            }) => ({
              get message() {
                const baseMessage = `Successfully downloaded ${fullTitle} in ${durationFromRequestToDownload.toString()} seconds using ${downloader}`;

                if (provider) {
                  return `${baseMessage} via ${provider}`;
                }

                return baseMessage;
              },
            }),
          },
        ],
      },

      "riven.media-item.download.partial-success": {
        description:
          "Indicates that a show or season has been partially downloaded.",
        actions: [
          {
            type: "log",
            params: ({
              event: {
                downloader,
                item: { fullTitle },
              },
            }) => ({
              message: `Partially downloaded ${fullTitle} using ${downloader}. Attempting to download the remaining items separately.`,
            }),
          },
          {
            type: "fanOutDownload",
            params: ({ event: { item } }) => ({ item }),
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
              message: `Error downloading ${item.fullTitle}: ${String(error)}`,
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

      "riven-internal.request-content-services": {
        description: "Requests content services for media items to ingest.",
        actions: { type: "requestContentServices" },
      },

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
    states: {
      "Bootstrapping flow workers": {
        invoke: {
          src: "bootstrapFlowWorkers",
          id: "bootstrapFlowWorkers",
          input: ({ self }) => ({
            parentRef: self,
          }),
          onError: {
            target: "Errored",
            actions: [
              {
                type: "log",
                params: ({ event }) => ({
                  message: `Error bootstrapping flow workers: ${String(event.error)}`,
                  level: "error",
                }),
              },
              { type: "handleGracefulShutdown" },
            ],
          },
          onDone: {
            target: "Running",
            actions: assign({
              flows: ({ event }) => event.output,
            }),
          },
        },
      },
      Running: {
        invoke: [
          {
            id: "requestContentServicesScheduler",
            src: "createEventScheduler",
            input: {
              event: "riven-internal.request-content-services",
              interval: 120_000,
              runImmediately: true,
            },
          },
        ],
        entry: [
          {
            type: "broadcastEventToPlugins",
            params: { type: "riven.core.started" },
          },
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
      },
      Errored: {
        type: "final",
        entry: {
          type: "log",
          params: () => ({
            message: `Riven has entered an unrecoverable error state and will shut down. Please check previous logs for more details.`,
            level: "error",
          }),
        },
      },
    },
  });

export type MainRunnerMachineIntake = (event: MainRunnerMachineEvent) => void;
