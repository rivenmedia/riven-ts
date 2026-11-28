import { ItemRequest, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { DelayedError, UnrecoverableError, WaitingChildrenError } from "bullmq";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { flow } from "#message-queue/flows/producer.ts";
import { createQueue } from "#message-queue/utilities/create-queue.ts";

import { processItemRequestProcessor } from "./process-item-request.processor.ts";

import type { ProcessItemRequestFlow } from "./process-item-request.schema.ts";
import type { UUID } from "node:crypto";

const it = baseIt
  .extend("spyOnAddBulk", () => () => vi.spyOn(flow, "addBulk"))
  .extend("indexedMovieData", () => (id: UUID, imdbId: string) => ({
    item: {
      id,
      title: "Test Movie",
      imdbId,
      contentRating: "g",
      genres: [],
      type: "movie",
      runtime: 40,
      releaseDate: DateTime.utc().minus({ years: 1 }).toISO(),
    },
  }))
  .extend(
    "processJob",
    ({ mockFlowProcessorContext, mockSentryScope }) =>
      async (job: Parameters<typeof processItemRequestProcessor>[0]["job"]) =>
        processItemRequestProcessor(
          { job, token: "token", scope: mockSentryScope },
          mockFlowProcessorContext,
        ),
  )
  .extend(
    "createProcessorJob",
    ({ createMockJob, createMockJobChildKey }) =>
      async (
        data: ProcessItemRequestFlow["input"],
        childrenValues: unknown[] = [],
      ) => {
        const job = await createMockJob(data);

        vi.spyOn(job, "updateData").mockImplementation(async (newData) => {
          job.data = newData;

          return Promise.resolve();
        });
        vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(true);
        vi.spyOn(job, "moveToDelayed").mockResolvedValue();
        vi.spyOn(job, "getChildrenValues").mockResolvedValue(
          Object.fromEntries(
            childrenValues.map((value) => [
              createMockJobChildKey("process-item-request"),
              value,
            ]),
          ),
        );

        return job;
      },
  );

it("fails when the item request does not exist", async ({
  createProcessorJob,
  processJob,
}) => {
  const itemRequestId = randomUUID();
  const job = await createProcessorJob({ itemRequestId, step: "request" });

  await expect(processJob(job)).rejects.toThrow(
    new UnrecoverableError(`Item request with ID ${itemRequestId} not found`),
  );
});

it("requests indexing from each subscribed plugin and waits for the results", async ({
  spyOnAddBulk,
  createProcessorJob,
  processJob,
  factories: { movieItemRequestFactory },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: "tt0133093",
    state: "requested",
  });
  const addBulkSpy = spyOnAddBulk().mockResolvedValue([]);
  const job = await createProcessorJob({
    itemRequestId: itemRequest.id,
    step: "request",
  });

  await expect(processJob(job)).rejects.toBeInstanceOf(WaitingChildrenError);

  expect(addBulkSpy).toHaveBeenCalledExactlyOnceWith([
    expect.objectContaining({
      name: `@repo/plugin-test - Index ${itemRequest.externalIdsLabel.join(" | ")}`,
      queueName:
        "riven.media-item.index.requested.movie.plugin[@repo/plugin-test]",
      data: { item: itemRequest.id },
      opts: expect.objectContaining({
        parent: { id: job.id, queue: job.queueQualifiedName },
      }),
    }),
  ]);
  expect(job.data.step).toBe("process");
});

it("marks the request as failed and retries in a day when no indexer returns a result", async ({
  em,
  createProcessorJob,
  processJob,
  factories: { movieItemRequestFactory },
}) => {
  vi.useFakeTimers({
    now: DateTime.utc().startOf("minute").toJSDate(),
    toFake: ["Date"],
  });

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: "tt0133093",
    state: "requested",
  });
  const job = await createProcessorJob(
    { itemRequestId: itemRequest.id, step: "process" },
    [null],
  );
  const moveToDelayedSpy = vi.spyOn(job, "moveToDelayed");

  await expect(processJob(job)).rejects.toThrow(
    new DelayedError(
      `Unable to index ${itemRequest.externalIdsLabel.join(" | ")}. Retrying in 24 hours.`,
    ),
  );

  expect(moveToDelayedSpy).toHaveBeenCalledExactlyOnceWith(
    DateTime.utc().plus({ days: 1 }).toMillis(),
  );

  await expect(
    em.fork().findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({ state: "failed" });

  vi.useRealTimers();
});

it("indexes the item from the indexer results and reports the success", async ({
  indexedMovieData,
  createProcessorJob,
  processJob,
  mockFlowProcessorContext,
  factories: { movieItemRequestFactory },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: "tt0133093",
    state: "requested",
  });
  const job = await createProcessorJob(
    { itemRequestId: itemRequest.id, step: "process" },
    [indexedMovieData(itemRequest.id, "tt0133093")],
  );

  createQueue("process-media-item");

  await expect(processJob(job)).resolves.toBeUndefined();

  expect(mockFlowProcessorContext.sendEvent).toHaveBeenCalledExactlyOnceWith({
    type: "riven.media-item.index.success",
    item: expect.any(Movie),
    meta: { type: "movie", isReindex: false },
  });
});

it("reports the error when the item cannot be indexed in its current state", async ({
  indexedMovieData,
  createProcessorJob,
  processJob,
  mockFlowProcessorContext,
  completedMovieContext: { completedMovie },
}) => {
  const itemRequest = await completedMovie.itemRequest.loadOrFail();

  const job = await createProcessorJob(
    { itemRequestId: itemRequest.id, step: "process" },
    [indexedMovieData(itemRequest.id, itemRequest.imdbId ?? "tt0133093")],
  );

  await expect(processJob(job)).rejects.toThrow(
    /^Failed to persist indexer data for Test Movie: /u,
  );

  expect(mockFlowProcessorContext.sendEvent).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      type: "riven.media-item.index.error.incorrect-state",
    }),
  );
});
