import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { DownloadItemFlow } from "../../../message-queue/flows/download-item/download-item.schema.ts";
import { FindValidTorrentFlow } from "../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { MapItemsToFilesFlow } from "../../../message-queue/flows/download-item/steps/map-items-to-files/map-items-to-files.schema.ts";
import { RankStreamsFlow } from "../../../message-queue/flows/download-item/steps/rank-streams/rank-streams.schema.ts";
import { RequestIndexDataFlow } from "../../../message-queue/flows/index-item/index-item.schema.ts";
import { RequestContentServicesFlow } from "../../../message-queue/flows/request-content-services/request-content-services.schema.ts";
import { ScrapeItemFlow } from "../../../message-queue/flows/scrape-item/scrape-item.schema.ts";
import { ParseScrapeResultsFlow } from "../../../message-queue/flows/scrape-item/steps/parse-scrape-results/parse-scrape-results.schema.ts";
import { createFlowWorker } from "../../../message-queue/utilities/create-flow-worker.ts";

import type { Flow } from "../../../message-queue/flows/index.ts";
import type { MainRunnerMachineEvent } from "../index.ts";
import type { Queue, Worker } from "bullmq";

export type BootstrapFlowWorkersOutput = {
  [K in Flow["name"]]: {
    queue: Queue;
    worker: Worker<
      Extract<Flow, { name: K }>["input"],
      Extract<Flow, { name: K }>["output"]
    >;
  };
};

export interface BootstrapFlowWorkersInput {
  parentRef: ActorRef<Snapshot<unknown>, MainRunnerMachineEvent>;
}

export const bootstrapFlowWorkers = fromPromise<
  BootstrapFlowWorkersOutput,
  BootstrapFlowWorkersInput
>(async ({ input: { parentRef } }) => {
  return {
    "index-item": await createFlowWorker(
      RequestIndexDataFlow,
      new URL(
        import.meta
          .resolve("../../../message-queue/flows/index-item/index-item.processor.js"),
      ),
      parentRef.send,
      {},
      { concurrency: 1 },
    ),
    "request-content-services": await createFlowWorker(
      RequestContentServicesFlow,
      new URL(
        import.meta
          .resolve("../../../message-queue/flows/request-content-services/request-content-services.processor.js"),
      ),
      parentRef.send,
      {},
      { concurrency: 1 },
    ),
    "scrape-item": await createFlowWorker(
      ScrapeItemFlow,
      new URL(
        import.meta
          .resolve("../../../message-queue/flows/scrape-item/scrape-item.processor.js"),
      ),
      parentRef.send,
      {},
      { concurrency: 1 },
    ),
    "scrape-item.parse-scrape-results": await createFlowWorker(
      ParseScrapeResultsFlow,
      new URL(
        import.meta
          .resolve("../../../message-queue/flows/scrape-item/steps/parse-scrape-results/parse-scrape-results.processor.js"),
      ),
      parentRef.send,
    ),
    "download-item": await createFlowWorker(
      DownloadItemFlow,
      new URL(
        import.meta
          .resolve("../../../message-queue/flows/download-item/download-item.processor.js"),
      ),
      parentRef.send,
    ),
    "download-item.map-items-to-files": await createFlowWorker(
      MapItemsToFilesFlow,
      new URL(
        import.meta
          .resolve("../../../message-queue/flows/download-item/steps/map-items-to-files/map-items-to-files.processor.js"),
      ),
      parentRef.send,
    ),
    "download-item.find-valid-torrent": await createFlowWorker(
      FindValidTorrentFlow,
      new URL(
        import.meta
          .resolve("../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.processor.js"),
      ),
      parentRef.send,
      {
        streams: {
          events: {
            maxLen: 10000,
          },
        },
      },
    ),
    "download-item.rank-streams": await createFlowWorker(
      RankStreamsFlow,
      new URL(
        import.meta
          .resolve("../../../message-queue/flows/download-item/steps/rank-streams/rank-streams.processor.js"),
      ),
      parentRef.send,
    ),
  };
});
