import { fromPromise } from "xstate";

import { MapItemsToFilesSandboxedJob } from "../../../message-queue/sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.schema.ts";
import { ParseScrapeResultsSandboxedJob } from "../../../message-queue/sandboxed-jobs/jobs/parse-scrape-results/parse-scrape-results.schema.ts";
import { ValidateTorrentFilesSandboxedJob } from "../../../message-queue/sandboxed-jobs/jobs/validate-torrent-files/validate-torrent-files.schema.ts";
import { createSandboxedWorker } from "../../../message-queue/sandboxed-jobs/utilities/create-sandboxed-worker.ts";

import type { SandboxedJobDefinition } from "../../../message-queue/sandboxed-jobs/index.ts";
import type { Queue, Worker } from "bullmq";

export type BootstrapSandboxedWorkersOutput = {
  [K in SandboxedJobDefinition["name"]]: {
    queue: Queue;
    worker: Worker<
      Extract<SandboxedJobDefinition, { name: K }>["input"],
      Extract<SandboxedJobDefinition, { name: K }>["output"]
    >;
  };
};

export const bootstrapSandboxedWorkers =
  fromPromise<BootstrapSandboxedWorkersOutput>(async () => {
    return {
      "scrape-item.parse-scrape-results": await createSandboxedWorker(
        ParseScrapeResultsSandboxedJob,
        new URL(
          import.meta
            .resolve("../../../message-queue/sandboxed-jobs/jobs/parse-scrape-results/parse-scrape-results.processor.js"),
        ),
        {},
        { concurrency: 5 },
      ),
      "download-item.map-items-to-files": await createSandboxedWorker(
        MapItemsToFilesSandboxedJob,
        new URL(
          import.meta
            .resolve("../../../message-queue/sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.processor.js"),
        ),
        {},
        { concurrency: 5 },
      ),
      "download-item.validate-torrent-files": await createSandboxedWorker(
        ValidateTorrentFilesSandboxedJob,
        new URL(
          import.meta
            .resolve("../../../message-queue/sandboxed-jobs/jobs/validate-torrent-files/validate-torrent-files.processor.js"),
        ),
        {},
        { concurrency: 5 },
      ),
    };
  });
