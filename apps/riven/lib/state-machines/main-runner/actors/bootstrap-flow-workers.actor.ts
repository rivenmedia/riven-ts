import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { downloadItemProcessor } from "../../../message-queue/flows/download-item/download-item.processor.ts";
import { DownloadItemFlow } from "../../../message-queue/flows/download-item/download-item.schema.ts";
import { findValidTorrentProcessor } from "../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.processor.ts";
import { FindValidTorrentFlow } from "../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { rankStreamsProcessor } from "../../../message-queue/flows/download-item/steps/rank-streams/rank-streams.processor.ts";
import { RankStreamsFlow } from "../../../message-queue/flows/download-item/steps/rank-streams/rank-streams.schema.ts";
import { indexItemProcessor } from "../../../message-queue/flows/index-item/index-item.processor.ts";
import { RequestIndexDataFlow } from "../../../message-queue/flows/index-item/index-item.schema.ts";
import { requestContentServicesProcessor } from "../../../message-queue/flows/request-content-services/request-content-services.processor.ts";
import { RequestContentServicesFlow } from "../../../message-queue/flows/request-content-services/request-content-services.schema.ts";
import { scrapeItemProcessor } from "../../../message-queue/flows/scrape-item/scrape-item.processor.ts";
import { ScrapeItemFlow } from "../../../message-queue/flows/scrape-item/scrape-item.schema.ts";
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
      indexItemProcessor,
      parentRef.send,
      {},
      { concurrency: 1 },
    ),
    "request-content-services": await createFlowWorker(
      RequestContentServicesFlow,
      requestContentServicesProcessor,
      parentRef.send,
      {},
      { concurrency: 1 },
    ),
    "scrape-item": await createFlowWorker(
      ScrapeItemFlow,
      scrapeItemProcessor,
      parentRef.send,
      {},
      { concurrency: 1 },
    ),
    "download-item": await createFlowWorker(
      DownloadItemFlow,
      downloadItemProcessor,
      parentRef.send,
    ),
    "download-item.find-valid-torrent": await createFlowWorker(
      FindValidTorrentFlow,
      findValidTorrentProcessor,
      parentRef.send,
      {
        streams: {
          events: {
            maxLen: 10000,
          },
        },
      },
      { concurrency: 10 },
    ),
    "download-item.rank-streams": await createFlowWorker(
      RankStreamsFlow,
      rankStreamsProcessor,
      parentRef.send,
    ),
  };
});
