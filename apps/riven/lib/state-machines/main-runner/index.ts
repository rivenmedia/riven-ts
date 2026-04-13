import { type Movie, Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { RivenEvent } from "@repo/util-plugin-sdk/events";

import chalk from "chalk";
import {
  type ActorRef,
  type Snapshot,
  enqueueActions,
  raise,
  sendTo,
  setup,
} from "xstate";

import { downloadItemProcessor } from "../../message-queue/flows/download-item/download-item.processor.ts";
import { DownloadItemFlow } from "../../message-queue/flows/download-item/download-item.schema.ts";
import { findValidTorrentProcessor } from "../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.processor.ts";
import { FindValidTorrentFlow } from "../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { rankStreamsProcessor } from "../../message-queue/flows/download-item/steps/rank-streams/rank-streams.processor.ts";
import { RankStreamsFlow } from "../../message-queue/flows/download-item/steps/rank-streams/rank-streams.schema.ts";
import { indexItemProcessor } from "../../message-queue/flows/index-item/index-item.processor.ts";
import { RequestIndexDataFlow } from "../../message-queue/flows/index-item/index-item.schema.ts";
import { requestContentServicesProcessor } from "../../message-queue/flows/request-content-services/request-content-services.processor.ts";
import { RequestContentServicesFlow } from "../../message-queue/flows/request-content-services/request-content-services.schema.ts";
import { scrapeItemProcessor } from "../../message-queue/flows/scrape-item/scrape-item.processor.ts";
import { ScrapeItemFlow } from "../../message-queue/flows/scrape-item/scrape-item.schema.ts";
import { MapItemsToFilesSandboxedJob } from "../../message-queue/sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.schema.ts";
import { ParseScrapeResultsSandboxedJob } from "../../message-queue/sandboxed-jobs/jobs/parse-scrape-results/parse-scrape-results.schema.ts";
import { ValidateTorrentFilesSandboxedJob } from "../../message-queue/sandboxed-jobs/jobs/validate-torrent-files/validate-torrent-files.schema.ts";
import { createSandboxedWorker } from "../../message-queue/sandboxed-jobs/utilities/create-sandboxed-worker.ts";
import { createFlowWorker } from "../../message-queue/utilities/create-flow-worker.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { createEventScheduler } from "./actors/event-scheduler.actor.ts";
import {
  type FanOutDownloadInput,
  fanOutDownload,
} from "./actors/fan-out-download.actor.ts";
import { jobEnqueuer } from "./actors/job-enqueuer.actor.ts";
import { requestContentServices } from "./actors/request-content-services.actor.ts";
import { requestDownload } from "./actors/request-download.actor.ts";
import { requestIndexData } from "./actors/request-index-data.actor.ts";
import { requestScrape } from "./actors/request-scrape.actor.ts";
import { retryLibrary } from "./actors/retry-library.actor.ts";
import {
  type ScheduleReindexInput,
  scheduleReindex,
} from "./actors/schedule-reindex.actor.ts";
import { onNewShowRequestedSubscriber } from "./actors/subscribers/on-new-show-requested.subscriber.ts";
import { getPluginEventSubscribers } from "./utilities/get-plugin-event-subscribers.ts";

import type { RivenInternalEvent } from "../../message-queue/events/index.ts";
import type { EnqueueDownloadItemInput } from "../../message-queue/flows/download-item/enqueue-download-item.ts";
import type { EnqueueIndexItemInput } from "../../message-queue/flows/index-item/enqueue-index-item.ts";
import type { Flow } from "../../message-queue/flows/index.ts";
import type { EnqueueScrapeItemInput } from "../../message-queue/flows/scrape-item/enqueue-scrape-items.ts";
import type { SandboxedJobDefinition } from "../../message-queue/sandboxed-jobs/index.ts";
import type {
  PluginQueueMap,
  PluginWorkerMap,
  PublishableEventSet,
  ValidPluginMap,
} from "../../types/plugins.ts";
import type { RivenMachineEvent } from "../program/index.ts";
import type { Queue, Worker } from "bullmq";

export interface MainRunnerMachineContext {
  parentRef: ActorRef<Snapshot<unknown>, RivenMachineEvent>;
  plugins: ValidPluginMap;
  flowWorkers: {
    [K in Flow["name"]]: {
      queue: Queue;
      worker: Worker<
        Extract<Flow, { name: K }>["input"],
        Extract<Flow, { name: K }>["output"]
      >;
    };
  };
  sandboxedWorkers: {
    [K in SandboxedJobDefinition["name"]]: {
      queue: Queue;
      worker: Worker<
        Extract<SandboxedJobDefinition, { name: K }>["input"],
        Extract<SandboxedJobDefinition, { name: K }>["output"]
      >;
    };
  };
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
      requestContentServices: "requestContentServices";
      requestIndexData: "requestIndexData";
      requestScrape: "requestScrape";
      fanOutDownload: "fanOutDownload";
    },
  },
  actions: {
    handleGracefulShutdown: ({ context }) => {
      context.parentRef.send({
        type: "riven.core.shutdown",
      });
    },
    requestContentServices: enqueueActions(
      ({ enqueue, context: { plugins } }) => {
        enqueue.spawnChild("requestContentServices", {
          id: "requestContentServices",
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
        enqueue.spawnChild("requestIndexData", {
          id: "requestIndexData",
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
        enqueue.spawnChild("scheduleReindex", {
          id: "scheduleReindex",
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
        enqueue.spawnChild("requestScrape", {
          id: "requestScrape",
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

        enqueue.spawnChild("requestDownload", {
          id: "requestDownload",
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
        enqueue.spawnChild("fanOutDownload", {
          id: "fanOutDownload",
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
      enqueue.spawnChild("retryLibrary", {
        id: "retryLibrary",
        input: {
          parentRef: self,
        },
      });
    }),
  },
  actors: {
    createEventScheduler,
    fanOutDownload,
    jobEnqueuer,
    onNewShowRequestedSubscriber,
    retryLibrary,
    requestContentServices,
    requestIndexData,
    requestScrape,
    requestDownload,
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
    isOngoingItem: (_, item: Movie | Show) => {
      if (item instanceof Show) {
        return item.state === "ongoing";
      }

      return !item.isReleased;
    },
    isUnreleasedItem: (_, item: Movie | Show) => item.state === "unreleased",
    isEntirelyReleasedItem: (_, item: Movie | Show) => {
      if (item instanceof Show) {
        return item.status === "ended";
      }

      return item.isReleased;
    },
  },
})
  .extend(withLogAction)
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABABwCcB7KAgQwFscKzVcCBXLLMAgYgI2wDoLJUyAWlQAXMBW4AqANoAGALqJQeIrFGoiWJSAAeiAIwAmADQgAnogCsATmvcAHEcsBfZ6bSZchEuSo06OIzMrBxcWIJ4ADYMUHS8-EKi4twEYACODHBiEHKKSCAqaiIaWvl6CEamFggALJaGDjYAzADsLm4gHtj4xKSU1LT0TCzsnJ7xEALCYhIAxqlkxZrcrMQEudqF6pra5ZXmiE2yltzWsgBshu3uYT0+-f5DwaNhE1NJcwtLWNxkkQsQMyCMA6VCwESwDb5LbfXYGEwHCqWeynSxNJyuG6eO59PyDQLDEJjHipEQEIGRVAAI3I5KhylU21KoD2COqRlcHSwRAgcG0XS8vV8AwCQRGm0ZsLKiDa3FkhhaTRqrUsVRlln03Ba50sl3ariAA */
    id: "Riven program main runner",
    initial: "Running",
    context: ({ input, self }) => ({
      parentRef: input.parentRef,
      plugins: input.plugins,
      publishableEvents: input.publishableEvents,
      pluginQueues: input.pluginQueues,
      pluginWorkers: input.pluginWorkers,
      flowWorkers: {
        "index-item": createFlowWorker(
          RequestIndexDataFlow,
          indexItemProcessor,
          self.send,
          {},
          { concurrency: 1 },
        ),
        "request-content-services": createFlowWorker(
          RequestContentServicesFlow,
          requestContentServicesProcessor,
          self.send,
          {},
          { concurrency: 1 },
        ),
        "scrape-item": createFlowWorker(
          ScrapeItemFlow,
          scrapeItemProcessor,
          self.send,
          {},
          { concurrency: 1 },
        ),
        "download-item": createFlowWorker(
          DownloadItemFlow,
          downloadItemProcessor,
          self.send,
        ),
        "download-item.find-valid-torrent": createFlowWorker(
          FindValidTorrentFlow,
          findValidTorrentProcessor,
          self.send,
          {
            streams: {
              events: {
                maxLen: 10000,
              },
            },
          },
          { concurrency: 10 },
        ),
        "download-item.rank-streams": createFlowWorker(
          RankStreamsFlow,
          rankStreamsProcessor,
          self.send,
        ),
      },
      sandboxedWorkers: {
        "scrape-item.parse-scrape-results": createSandboxedWorker(
          ParseScrapeResultsSandboxedJob,
          new URL(
            import.meta.resolve("@repo/riven/workers/parse-scrape-results"),
          ),
          {},
          { concurrency: 5 },
        ),
        "download-item.map-items-to-files": createSandboxedWorker(
          MapItemsToFilesSandboxedJob,
          new URL(
            import.meta.resolve("@repo/riven/workers/map-items-to-files"),
          ),
          {},
          { concurrency: 15 },
        ),
        "download-item.validate-torrent-files": createSandboxedWorker(
          ValidateTorrentFilesSandboxedJob,
          new URL(
            import.meta.resolve("@repo/riven/workers/validate-torrent-files"),
          ),
          {},
          { concurrency: 5 },
        ),
      },
    }),
    states: {
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
          {
            id: "jobEnqueuer",
            src: "jobEnqueuer",
            input: ({ context: { plugins, pluginQueues } }) => ({
              plugins,
              pluginQueues,
            }),
          },
          {
            id: "onNewShowRequestedSubscriber",
            src: "onNewShowRequestedSubscriber",
            onSnapshot: {
              actions: enqueueActions(({ event, enqueue }) => {
                if (!event.snapshot.context?.data?.showRequested) {
                  return;
                }

                console.log(event.snapshot.context.data);

                return;

                enqueue.raise({
                  type: "riven.item-request.create.success",
                  item: event.snapshot.context.data.newShowRequested,
                });
              }),
            },
          },
        ],
        always: [
          {
            guard: "shouldQueueEvent",
            actions: sendTo("jobEnqueuer", ({ event }) => event),
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
        entry: [
          raise({ type: "riven.core.started" }),
          raise({ type: "riven-internal.retry-library" }),
          {
            type: "log",
            params: { message: "Riven has started successfully." },
          },
        ],
        on: {
          /**
           * Item request lifecycle events
           */

          "riven.item-request.create.success": {
            description:
              "Indicates that a media item has been successfully created in the library.",
            actions: [
              // {
              //   type: "log",
              //   params: ({ event: { item } }) => ({
              //     message: `Successfully created item request: [${item.externalIdsLabel.join(" | ")}]`,
              //     level: "silly",
              //   }),
              // },
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
                  get message() {
                    const labels = [
                      item.imdbId && `IMDB: ${item.imdbId}`,
                      item.tmdbId && `TMDB: ${item.tmdbId}`,
                      item.tvdbId && `TVDB: ${item.tvdbId}`,
                    ]
                      .filter(Boolean)
                      .join(" | ");

                    return `Error creating item request for [${labels}]`;
                  },
                  level: "error",
                  error,
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
                  message: `Skipping existing item request: ${[item.imdbId && `IMDB: ${item.imdbId}`, item.tmdbId && `TMDB: ${item.tmdbId}`, item.tvdbId && `TVDB: ${item.tvdbId}`].filter(Boolean).join(" | ")}`,
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
                    (item) =>
                      item.state === "indexed" && item instanceof Season,
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
                type: "isEntirelyReleasedItem",
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
                params: ({ event: { item } }) => {
                  const externalIds = [
                    item.imdbId && `IMDB: ${item.imdbId}`,
                    item.tmdbId && `TMDB: ${item.tmdbId}`,
                    item.tvdbId && `TVDB: ${item.tvdbId}`,
                  ]
                    .filter(Boolean)
                    .join(" | ");

                  return {
                    message: `Media item has already been indexed: ${chalk.dim(externalIds)}`,
                    level: "verbose",
                  };
                },
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
                  message: `Successfully scraped ${item.type}: ${chalk.bold(item.fullTitle)}`,
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
                    const baseMessage = `Successfully downloaded ${chalk.bold(fullTitle)} in ${durationFromRequestToDownload.toString()} seconds using ${downloader}`;

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
                  message: `Error downloading ${chalk.bold(item.fullTitle)}`,
                  level: "error",
                  error,
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
            description:
              "Retries any incomplete media items and item requests.",
            actions: { type: "retryLibrary" },
          },

          "riven-internal.retry-item-download": {
            description:
              "Retries the download process for a scraped media item.",
            actions: {
              type: "requestDownload",
              params: ({ event: { item } }) => ({
                item,
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
            message:
              "Riven has entered an unrecoverable error state and will shut down. Please check previous logs for more details.",
            level: "error",
          },
        },
      },
    },
  });

export type MainRunnerMachineIntake = (event: MainRunnerMachineEvent) => void;
