import { Worker } from "bullmq";
import { randomUUID } from "node:crypto";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { flow } from "#message-queue/flows/producer.ts";
import { createQueue } from "#message-queue/utilities/create-queue.ts";
import { settings } from "#utilities/settings.ts";

import { isMediaItemProcessing } from "./is-media-item-processing.ts";

import type { FlowChildJob } from "bullmq";

const it = baseIt
  .extend("mediaItem", () => ({ id: randomUUID(), type: "movie" as const }))
  .extend("queues", () => ({
    processMediaItem: createQueue("process-media-item"),
    scrapeItem: createQueue("scrape-item"),
    parseScrapeResults: createQueue("scrape-item.parse-scrape-results"),
  }))
  .extend(
    "addProcessMediaItemFlow",
    ({ mediaItem, queues: _queues }) =>
      async (children?: FlowChildJob[]) =>
        flow.add({
          name: "Process media item",
          queueName: "process-media-item",
          data: {},
          opts: {
            deduplication: {
              id: `process-${mediaItem.type}-${mediaItem.id}`,
            },
          },
          ...(children && { children }),
        }),
  )
  .extend("activateNextJob", ({}, { onCleanup }) => {
    const workers = new Set<Worker>();

    onCleanup(async () => {
      for (const worker of workers) {
        await worker.close();
      }
    });

    return async (queueName: string) => {
      const worker = new Worker(queueName, null, {
        autorun: false,
        connection: { url: settings.redisUrl },
      });

      workers.add(worker);

      const job = await worker.getNextJob(randomUUID());

      expect.assert(job, `No job available in ${queueName}`);

      return job;
    };
  });

it("returns false if the media item has no processing job", async ({
  mediaItem,
  queues,
}) => {
  await queues.processMediaItem.waitUntilReady();

  await expect(isMediaItemProcessing(mediaItem)).resolves.toBe(false);
});

it("returns false if the media item's job is waiting to be processed", async ({
  mediaItem,
  addProcessMediaItemFlow,
}) => {
  await addProcessMediaItemFlow();

  await expect(isMediaItemProcessing(mediaItem)).resolves.toBe(false);
});

it("returns true if the media item's job is active", async ({
  mediaItem,
  addProcessMediaItemFlow,
  activateNextJob,
}) => {
  await addProcessMediaItemFlow();
  await activateNextJob("process-media-item");

  await expect(isMediaItemProcessing(mediaItem)).resolves.toBe(true);
});

it("returns false if the media item's job is waiting for children that are not active", async ({
  mediaItem,
  addProcessMediaItemFlow,
}) => {
  await addProcessMediaItemFlow([
    { name: "Scrape item", queueName: "scrape-item", data: {} },
  ]);

  await expect(isMediaItemProcessing(mediaItem)).resolves.toBe(false);
});

it("returns true if one of the media item's job's children is active", async ({
  mediaItem,
  addProcessMediaItemFlow,
  activateNextJob,
}) => {
  await addProcessMediaItemFlow([
    { name: "Scrape item", queueName: "scrape-item", data: {} },
  ]);
  await activateNextJob("scrape-item");

  await expect(isMediaItemProcessing(mediaItem)).resolves.toBe(true);
});

it("returns true if one of the media item's job's descendants is active", async ({
  mediaItem,
  addProcessMediaItemFlow,
  activateNextJob,
}) => {
  await addProcessMediaItemFlow([
    {
      name: "Scrape item",
      queueName: "scrape-item",
      data: {},
      children: [
        {
          name: "Parse scrape results",
          queueName: "scrape-item.parse-scrape-results",
          data: {},
        },
      ],
    },
  ]);
  await activateNextJob("scrape-item.parse-scrape-results");

  await expect(isMediaItemProcessing(mediaItem)).resolves.toBe(true);
});

it("returns false if the media item's job has finished processing", async ({
  mediaItem,
  addProcessMediaItemFlow,
  activateNextJob,
}) => {
  await addProcessMediaItemFlow();

  const job = await activateNextJob("process-media-item");

  expect.assert(job.token);

  await job.moveToCompleted("done", job.token, false);

  await expect(isMediaItemProcessing(mediaItem)).resolves.toBe(false);
});
