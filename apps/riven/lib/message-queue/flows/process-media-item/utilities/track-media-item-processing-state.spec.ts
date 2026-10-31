import { Job, Worker } from "bullmq";
import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { pubSub } from "#graphql/pubsub.ts";
import { flow } from "#message-queue/flows/producer.ts";
import { createQueue } from "#message-queue/utilities/create-queue.ts";
import { settings } from "#utilities/settings.ts";

import {
  publishMediaItemProcessingState,
  trackMediaItemProcessingState,
} from "./track-media-item-processing-state.ts";

const it = baseIt
  .extend("mediaItemId", () => randomUUID())
  .extend("queues", () => ({
    processMediaItem: createQueue("process-media-item"),
    scrapeItem: createQueue("scrape-item"),
    parseScrapeResults: createQueue("scrape-item.parse-scrape-results"),
  }))
  .extend(
    "addProcessMediaItemFlow",
    ({ mediaItemId, queues: _queues }) =>
      async () => {
        const { job, children } = await flow.add({
          name: "Process media item",
          queueName: "process-media-item",
          data: {
            mediaItem: { id: mediaItemId, type: "movie", fullTitle: "Movie" },
          },
          children: [
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
          ],
        });

        const grandchild = children?.[0]?.children?.[0]?.job;

        expect.assert(grandchild);

        return { job, grandchild };
      },
  )
  .extend("createWorker", ({}, { onCleanup }) => {
    const workers = new Set<Worker>();

    onCleanup(async () => {
      for (const worker of workers) {
        await worker.close();
      }
    });

    return (queueName: string) => {
      // Jobs are fetched and events are emitted manually, so the worker never runs by itself
      const worker = new Worker(queueName, null, {
        autorun: false,
        connection: { url: settings.redisUrl },
      });

      workers.add(worker);

      return worker;
    };
  });

it("publishes that the media item is processing while one of its jobs is active", async ({
  mediaItemId,
  addProcessMediaItemFlow,
  createWorker,
}) => {
  const publishSpy = vi.spyOn(pubSub, "publish");
  const { grandchild } = await addProcessMediaItemFlow();

  await createWorker("scrape-item.parse-scrape-results").getNextJob(
    randomUUID(),
  );

  await publishMediaItemProcessingState(grandchild);

  expect(publishSpy).toHaveBeenCalledExactlyOnceWith(
    "MEDIA_ITEM_PROCESSING_STATE_CHANGED",
    mediaItemId,
    true,
  );
});

it("publishes that the media item is not processing while none of its jobs are active", async ({
  mediaItemId,
  addProcessMediaItemFlow,
}) => {
  const publishSpy = vi.spyOn(pubSub, "publish");
  const { job } = await addProcessMediaItemFlow();

  await publishMediaItemProcessingState(job);

  expect(publishSpy).toHaveBeenCalledExactlyOnceWith(
    "MEDIA_ITEM_PROCESSING_STATE_CHANGED",
    mediaItemId,
    false,
  );
});

it("does not publish anything for jobs that do not belong to a media item's processing job", async ({
  mockQueue,
}) => {
  const publishSpy = vi.spyOn(pubSub, "publish");
  const job = await Job.create(mockQueue, "Unrelated job", {});

  await publishMediaItemProcessingState(job);

  expect(publishSpy).not.toHaveBeenCalled();
});

it("publishes the media item's processing state when a tracked worker starts working on one of its jobs", async ({
  mediaItemId,
  addProcessMediaItemFlow,
  createWorker,
}) => {
  const publishSpy = vi.spyOn(pubSub, "publish");
  const worker = createWorker("scrape-item.parse-scrape-results");

  trackMediaItemProcessingState(worker);

  await addProcessMediaItemFlow();
  await worker.getNextJob(randomUUID());

  await vi.waitFor(() => {
    expect(publishSpy).toHaveBeenCalledExactlyOnceWith(
      "MEDIA_ITEM_PROCESSING_STATE_CHANGED",
      mediaItemId,
      true,
    );
  });
});

it("publishes the media item's processing state when a tracked worker completes one of its jobs", async ({
  mediaItemId,
  addProcessMediaItemFlow,
  createWorker,
}) => {
  const publishSpy = vi.spyOn(pubSub, "publish");
  const worker = createWorker("scrape-item.parse-scrape-results");
  const { grandchild } = await addProcessMediaItemFlow();

  trackMediaItemProcessingState(worker);

  worker.emit("completed", grandchild, {}, "active");

  await vi.waitFor(() => {
    expect(publishSpy).toHaveBeenCalledExactlyOnceWith(
      "MEDIA_ITEM_PROCESSING_STATE_CHANGED",
      mediaItemId,
      false,
    );
  });
});

it("publishes the media item's processing state when one of its jobs fails in a tracked worker", async ({
  mediaItemId,
  addProcessMediaItemFlow,
  createWorker,
}) => {
  const publishSpy = vi.spyOn(pubSub, "publish");
  const worker = createWorker("scrape-item.parse-scrape-results");
  const { grandchild } = await addProcessMediaItemFlow();

  trackMediaItemProcessingState(worker);

  worker.emit("failed", grandchild, new Error("Job failed"), "active");

  await vi.waitFor(() => {
    expect(publishSpy).toHaveBeenCalledExactlyOnceWith(
      "MEDIA_ITEM_PROCESSING_STATE_CHANGED",
      mediaItemId,
      false,
    );
  });
});
