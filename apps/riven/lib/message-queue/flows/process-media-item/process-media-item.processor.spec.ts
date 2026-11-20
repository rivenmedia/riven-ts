import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { DelayedError, UnrecoverableError, WaitingChildrenError } from "bullmq";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { flow } from "#message-queue/flows/producer.ts";

import { processMediaItemProcessor } from "./process-media-item.processor.ts";

import type { ProcessMediaItemFlow } from "./process-media-item.schema.ts";
import type { FlowJob } from "bullmq";

const it = baseIt
  .extend(
    "processJob",
    ({ mockFlowProcessorContext, mockSentryScope }) =>
      async (job: Parameters<typeof processMediaItemProcessor>[0]["job"]) =>
        processMediaItemProcessor(
          { job, token: "token", scope: mockSentryScope },
          mockFlowProcessorContext,
        ),
  )
  .extend(
    "createProcessorJob",
    ({ createMockJob }) =>
      async (
        item: Pick<MediaItem, "id" | "type" | "fullTitle">,
        data: Partial<ProcessMediaItemFlow["input"]>,
        { ignoredChildren = 0, hasPendingChildren = false } = {},
      ) => {
        const job = await createMockJob<ProcessMediaItemFlow["input"]>({
          step: "scrape",
          isRootItem: true,
          mediaItem: {
            id: item.id,
            type: item.type,
            fullTitle: item.fullTitle,
          },
          ...data,
        });

        vi.spyOn(job, "updateData").mockImplementation(async (newData) => {
          job.data = newData;

          return Promise.resolve();
        });
        vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(
          hasPendingChildren,
        );
        vi.spyOn(job, "getDependenciesCount").mockResolvedValue({
          ignored: ignoredChildren,
        });
        vi.spyOn(job, "moveToDelayed").mockResolvedValue();

        return job;
      },
  );

const enqueuedQueues = (spy: { mock: { calls: [FlowJob, ...unknown[]][] } }) =>
  spy.mock.calls.map(([node]) => node.queueName);

it("enqueues the item for scraping and waits for the scrape to finish", async ({
  createProcessorJob,
  processJob,
  indexedMovieContext: { indexedMovie },
}) => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);
  const job = await createProcessorJob(
    indexedMovie,
    { step: "scrape" },
    { hasPendingChildren: true },
  );

  await expect(processJob(job)).rejects.toBeInstanceOf(WaitingChildrenError);

  expect(enqueuedQueues(addSpy)).toStrictEqual(["scrape-item"]);
  expect(addSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { id: indexedMovie.id },
      opts: expect.objectContaining({
        parent: { id: job.id, queue: job.queueQualifiedName },
      }),
    }),
  );
  expect(job.data.step).toBe("validate-scrape");
});

it("fails without scraping an item that has exhausted its scrape attempts", async ({
  em,
  createProcessorJob,
  processJob,
  overrideRuntimeSettings,
  indexedMovieContext: { indexedMovie },
}) => {
  overrideRuntimeSettings({
    general: { scraping: { maximumFailedAttempts: 3 } },
  });

  // Bypasses the subscribers, so the item remains scrapable
  await em.nativeUpdate(
    MediaItem,
    { id: indexedMovie.id },
    { failedScrapeAttempts: 3 },
  );

  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);
  const job = await createProcessorJob(
    indexedMovie,
    { step: "scrape" },
    { hasPendingChildren: true },
  );

  await expect(processJob(job)).rejects.toThrow(
    new UnrecoverableError(
      `${indexedMovie.fullTitle} has exhausted all scrape attempts and cannot be scraped again`,
    ),
  );
  expect(addSpy).not.toHaveBeenCalled();
});

it("enqueues the item for downloading after a successful scrape", async ({
  createProcessorJob,
  processJob,
  scrapedMovieContext: { scrapedMovie },
}) => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);
  const job = await createProcessorJob(
    scrapedMovie,
    { step: "validate-scrape" },
    { hasPendingChildren: true },
  );

  await expect(processJob(job)).rejects.toBeInstanceOf(WaitingChildrenError);

  expect(enqueuedQueues(addSpy)).toStrictEqual(["download-item"]);
  expect(job.data.step).toBe("validate-download");
});

it.for([
  { isRootItem: true, error: "failed to scrape after all attempts" },
  { isRootItem: false, error: "failed to scrape" },
])(
  "fails when scraping failed (root item: $isRootItem)",
  async (
    { isRootItem, error },
    { createProcessorJob, processJob, indexedMovieContext: { indexedMovie } },
  ) => {
    const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);
    const job = await createProcessorJob(
      indexedMovie,
      { step: "validate-scrape", isRootItem },
      { ignoredChildren: 1 },
    );

    await expect(processJob(job)).rejects.toThrow(
      new UnrecoverableError(`${indexedMovie.fullTitle} ${error}`),
    );
    expect(addSpy).not.toHaveBeenCalled();
  },
);

it("schedules another scrape 30 minutes after a failed download", async ({
  createProcessorJob,
  processJob,
  scrapedMovieContext: { scrapedMovie },
}) => {
  vi.useFakeTimers({
    now: DateTime.utc().startOf("minute").toJSDate(),
    toFake: ["Date"],
  });

  const job = await createProcessorJob(
    scrapedMovie,
    { step: "validate-download" },
    { ignoredChildren: 1 },
  );

  const moveToDelayedSpy = vi.spyOn(job, "moveToDelayed");

  await expect(processJob(job)).rejects.toBeInstanceOf(DelayedError);

  expect(job.data.step).toBe("scrape");
  expect(moveToDelayedSpy).toHaveBeenCalledExactlyOnceWith(
    DateTime.utc().plus({ minutes: 30 }).toMillis(),
    "token",
  );

  vi.useRealTimers();
});

it.for([
  { requiresPostProcessing: true, enqueued: ["post-process-media-item"] },
  { requiresPostProcessing: false, enqueued: [] },
])(
  "completes a downloaded item (requires post-processing: $requiresPostProcessing)",
  async (
    { requiresPostProcessing, enqueued },
    {
      createProcessorJob,
      processJob,
      services,
      completedMovieContext: { completedMovie },
    },
  ) => {
    const addBulkSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);

    vi.spyOn(
      services.postProcessingService,
      "itemRequiresPostProcessing",
    ).mockReturnValue(requiresPostProcessing);

    const job = await createProcessorJob(completedMovie, {
      step: "validate-download",
    });

    await expect(processJob(job)).resolves.toBeUndefined();

    expect(job.data.step).toBe("complete");
    expect(
      addBulkSpy.mock.calls.flatMap(([nodes]) =>
        nodes.map(({ queueName }) => queueName),
      ),
    ).toStrictEqual(enqueued);
  },
);

it("fails when the item has not been downloaded after processing", async ({
  createProcessorJob,
  processJob,
  scrapedMovieContext: { scrapedMovie },
}) => {
  const job = await createProcessorJob(scrapedMovie, { step: "complete" });

  await expect(processJob(job)).rejects.toThrow(
    new UnrecoverableError(
      `Processing of ${scrapedMovie.fullTitle} did not complete successfully. Final state: scraped`,
    ),
  );
});

it("fails when the item does not exist", async ({
  createProcessorJob,
  processJob,
}) => {
  const id = randomUUID();
  const job = await createProcessorJob(
    { id, type: "movie", fullTitle: "Missing Movie" },
    { step: "scrape" },
  );

  await expect(processJob(job)).rejects.toThrow(
    new UnrecoverableError(`Media item with ID ${id} not found`),
  );
});
