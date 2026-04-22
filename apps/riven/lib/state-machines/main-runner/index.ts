import { type Movie, Show } from "@repo/util-plugin-sdk/dto/entities";
import { RivenEvent } from "@repo/util-plugin-sdk/events";

import chalk from "chalk";
import { Duration } from "luxon";
import os from "node:os";
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
import { processItemRequestProcessor } from "../../message-queue/flows/process-item-request/process-item-request.processor.ts";
import { ProcessItemRequestFlow } from "../../message-queue/flows/process-item-request/process-item-request.schema.ts";
import { processItemProcessor } from "../../message-queue/flows/process-media-item/process-media-item.processor.ts";
import { ProcessMediaItemFlow } from "../../message-queue/flows/process-media-item/process-media-item.schema.ts";
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
import { settings } from "../../utilities/settings.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { createEventScheduler } from "./actors/event-scheduler.actor.ts";
import {
  type FanOutDownloadInput,
  fanOutDownload,
} from "./actors/fan-out-download.actor.ts";
import { jobEnqueuer } from "./actors/job-enqueuer.actor.ts";
import { processItemRequest } from "./actors/process-item-request.actor.ts";
import { processMediaItem } from "./actors/process-media-item.actor.ts";
import { requestContentServices } from "./actors/request-content-services.actor.ts";
import { retryLibrary } from "./actors/retry-library.actor.ts";
import {
  type ScheduleReindexInput,
  scheduleReindex,
} from "./actors/schedule-reindex.actor.ts";
import { getPluginEventSubscribers } from "./utilities/get-plugin-event-subscribers.ts";

import type { RivenInternalEvent } from "../../message-queue/events/index.ts";
import type { Flow } from "../../message-queue/flows/index.ts";
import type { ProcessItemRequestInput } from "../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";
import type { EnqueueProcessMediaItemInput } from "../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";
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
      processItemRequest: "processItemRequest";
      processMediaItem: "processMediaItem";
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
    processItemRequest: enqueueActions(
      ({ enqueue }, input: ProcessItemRequestInput) => {
        enqueue.spawnChild("processItemRequest", {
          id: "processItemRequest",
          input: {
            item: input.item,
          },
        });
      },
    ),
    processMediaItem: enqueueActions(
      ({ enqueue }, input: EnqueueProcessMediaItemInput) => {
        enqueue.spawnChild("processMediaItem", {
          id: "processMediaItem",
          input,
        });
      },
    ),
    scheduleReindex: enqueueActions(
      ({ enqueue }, params: ScheduleReindexInput) => {
        enqueue.spawnChild("scheduleReindex", {
          id: "scheduleReindex",
          input: {
            item: params.item,
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
    fanOutDownload: enqueueActions(
      ({ enqueue }, params: FanOutDownloadInput) => {
        enqueue.spawnChild("fanOutDownload", {
          id: "fanOutDownload",
          input: {
            item: params.item,
          },
        });
      },
    ),
  },
  actors: {
    createEventScheduler,
    jobEnqueuer,
    processMediaItem,
    processItemRequest,
    retryLibrary,
    requestContentServices,
    scheduleReindex,
    fanOutDownload,
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
    context: ({ input, self }) => {
      const availableParallelism = os.availableParallelism();

      return {
        parentRef: input.parentRef,
        plugins: input.plugins,
        publishableEvents: input.publishableEvents,
        pluginQueues: input.pluginQueues,
        pluginWorkers: input.pluginWorkers,
        flowWorkers: {
          "process-item-request": createFlowWorker(
            ProcessItemRequestFlow,
            processItemRequestProcessor,
            self.send,
            input.plugins,
          ),
          "process-media-item": createFlowWorker(
            ProcessMediaItemFlow,
            processItemProcessor,
            self.send,
            input.plugins,
          ),
          "request-content-services": createFlowWorker(
            RequestContentServicesFlow,
            requestContentServicesProcessor,
            self.send,
            input.plugins,
          ),
          "scrape-item": createFlowWorker(
            ScrapeItemFlow,
            scrapeItemProcessor,
            self.send,
            input.plugins,
            {},
            {
              settings: {
                backoffStrategy: (attemptsMade) => {
                  const [after2, after5, after10] =
                    settings.scrapeCooldownHours;

                  if (attemptsMade >= 10) {
                    return Duration.fromObject({ hours: after10 }).as(
                      "milliseconds",
                    );
                  }

                  if (attemptsMade >= 5) {
                    return Duration.fromObject({ hours: after5 }).as(
                      "milliseconds",
                    );
                  }

                  if (attemptsMade >= 2) {
                    return Duration.fromObject({ hours: after2 }).as(
                      "milliseconds",
                    );
                  }

                  return Duration.fromObject({ minutes: 30 }).as(
                    "milliseconds",
                  );
                },
              },
            },
          ),
          "download-item": createFlowWorker(
            DownloadItemFlow,
            downloadItemProcessor,
            self.send,
            input.plugins,
          ),
          "download-item.find-valid-torrent": createFlowWorker(
            FindValidTorrentFlow,
            findValidTorrentProcessor,
            self.send,
            input.plugins,
            {
              streams: {
                events: {
                  maxLen: 10000,
                },
              },
            },
          ),
          "download-item.rank-streams": createFlowWorker(
            RankStreamsFlow,
            rankStreamsProcessor,
            self.send,
            input.plugins,
          ),
        },
        sandboxedWorkers: {
          "scrape-item.parse-scrape-results": createSandboxedWorker(
            ParseScrapeResultsSandboxedJob,
            new URL(
              import.meta.resolve("@repo/riven/workers/parse-scrape-results"),
            ),
            {},
            { concurrency: availableParallelism * 0.25 },
          ),
          "download-item.map-items-to-files": createSandboxedWorker(
            MapItemsToFilesSandboxedJob,
            new URL(
              import.meta.resolve("@repo/riven/workers/map-items-to-files"),
            ),
            {},
            { concurrency: availableParallelism * 0.75 },
          ),
          "download-item.validate-torrent-files": createSandboxedWorker(
            ValidateTorrentFilesSandboxedJob,
            new URL(
              import.meta.resolve("@repo/riven/workers/validate-torrent-files"),
            ),
            {},
            { concurrency: availableParallelism * 0.25 },
          ),
        },
      };
    },
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
              {
                type: "log",
                params: ({ event: { item } }) => ({
                  message: `Successfully created item request: [${item.externalIdsLabel.join(" | ")}]`,
                  level: "silly",
                }),
              },
              {
                type: "processItemRequest",
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
            ],
          },

          /**
           * Index lifecycle events
           */
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
                {
                  type: "processMediaItem",
                  params: ({ event: { item } }) => ({ id: item.id }),
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
                  type: "log",
                  params: ({ event: { item } }) => ({
                    message: `Successfully indexed ${item.type}: ${item.fullTitle}`,
                    level: "info",
                  }),
                },
                {
                  type: "processMediaItem",
                  params: ({ event: { item } }) => ({ id: item.id }),
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

          // "riven.media-item.scrape.requested": {
          //   description:
          //     "Indicates that a media item scrape has been requested for an indexed media item.",
          //   actions: {
          //     type: "requestScrape",
          //     params: ({ event: { item } }) => ({ items: [item] }),
          //   },
          // },

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
                    durationMs,
                    provider,
                  },
                }) => ({
                  get message() {
                    const formattedDuration = Duration.fromMillis(durationMs)
                      .rescale()
                      .toHuman({
                        showZeros: false,
                        maximumFractionDigits: 0,
                        unitDisplay: "narrow",
                      });

                    const baseMessage = `Successfully downloaded ${chalk.bold(fullTitle)} in ${formattedDuration} using ${downloader}`;

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

          // "riven-internal.retry-library": {
          //   description:
          //     "Retries any incomplete media items and item requests.",
          //   actions: { type: "retryLibrary" },
          // },
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
