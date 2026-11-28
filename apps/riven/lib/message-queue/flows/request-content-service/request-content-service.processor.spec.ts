import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { WaitingChildrenError } from "bullmq";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import { requestContentServiceProcessor } from "./request-content-service.processor.ts";

import type { RequestContentServiceFlow } from "./request-content-service.schema.ts";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

const it = baseIt
  .extend(
    "processJob",
    ({ mockFlowProcessorContext, mockSentryScope }) =>
      async (
        job: Parameters<typeof requestContentServiceProcessor>[0]["job"],
      ) =>
        requestContentServiceProcessor(
          { job, token: "token", scope: mockSentryScope },
          mockFlowProcessorContext,
        ),
  )
  .extend(
    "createProcessorJob",
    ({ createMockJob, createMockJobChildKey }) =>
      async (
        step: RequestContentServiceFlow["input"]["step"],
        childrenValues: ContentServiceRequestedResponse[] = [],
      ) => {
        const job = await createMockJob<RequestContentServiceFlow["input"]>({
          step,
          contentServicePlugin: "@repo/plugin-test",
        });

        vi.spyOn(job, "updateData").mockImplementation(async (newData) => {
          job.data = newData;

          return Promise.resolve();
        });
        vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(true);
        vi.spyOn(job, "removeDeduplicationKey").mockResolvedValue(true);
        vi.spyOn(job, "getChildrenValues").mockResolvedValue(
          Object.fromEntries(
            childrenValues.map((value) => [
              createMockJobChildKey("request-content-services"),
              value,
            ]),
          ),
        );

        return job;
      },
  );

it("requests content from the content service plugin and waits for it", async ({
  createProcessorJob,
  processJob,
  flowAddSpy,
}) => {
  const job = await createProcessorJob("request");

  await expect(processJob(job)).rejects.toBeInstanceOf(WaitingChildrenError);

  expect(flowAddSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      queueName: "riven.content-service.requested.plugin[@repo/plugin-test]",
      opts: expect.objectContaining({
        parent: { id: job.id, queue: job.queueQualifiedName },
      }),
    }),
  );
  expect(job.data.step).toBe("process");
});

it("requests each unique item returned by the content service once", async ({
  em,
  createProcessorJob,
  processJob,
  mockFlowProcessorContext: { sendEvent },
}) => {
  const job = await createProcessorJob("process", [
    {
      movies: [{ tmdbId: "603" }, { imdbId: "tt0133093" }, { tmdbId: "603" }],
      shows: [{ tvdbId: "121361" }],
      updateIntervalSeconds: null,
    },
    {
      movies: [{}],
      shows: [{ tvdbId: "121361" }, {}],
      updateIntervalSeconds: null,
    },
  ]);

  await expect(processJob(job)).resolves.toStrictEqual({
    count: 3,
    newItems: 3,
    updatedItems: 0,
  });

  const fork = em.fork();

  await expect(fork.count(ItemRequest)).resolves.toBe(3);

  expect(sendEvent).toHaveBeenCalledTimes(3);
  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.item-request.create.success",
    item: expect.objectContaining({ type: "show", tvdbId: "121361" }),
  });
});

it("requests a movie and a show that share an ID from different sources", async ({
  em,
  createProcessorJob,
  processJob,
}) => {
  const job = await createProcessorJob("process", [
    {
      movies: [{ tmdbId: "1399" }],
      shows: [{ tvdbId: "1399" }],
      updateIntervalSeconds: null,
    },
  ]);

  await expect(processJob(job)).resolves.toMatchObject({
    count: 2,
    newItems: 2,
  });

  const fork = em.fork();

  await expect(
    fork.count(ItemRequest, { type: "movie", tmdbId: "1399" }),
  ).resolves.toBe(1);
  await expect(
    fork.count(ItemRequest, { type: "show", tvdbId: "1399" }),
  ).resolves.toBe(1);
});

it("reports items that have already been requested without failing", async ({
  createProcessorJob,
  processJob,
  mockFlowProcessorContext: { sendEvent },
  indexedMovieContext: { indexedMovie },
}) => {
  const itemRequest = await indexedMovie.itemRequest.loadOrFail();

  expect.assert(itemRequest.tmdbId);

  const job = await createProcessorJob("process", [
    {
      movies: [{ tmdbId: itemRequest.tmdbId }],
      shows: [],
      updateIntervalSeconds: null,
    },
  ]);

  await expect(processJob(job)).resolves.toStrictEqual({
    count: 1,
    newItems: 0,
    updatedItems: 0,
  });

  expect(sendEvent).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      type: "riven.item-request.create.error.conflict",
    }),
  );
});

it("requests the content service again after its update interval", async ({
  createProcessorJob,
  processJob,
  flowAddSpy,
}) => {
  const job = await createProcessorJob("process", [
    { movies: [], shows: [], updateIntervalSeconds: 300 },
  ]);
  const removeDeduplicationKeySpy = vi.spyOn(job, "removeDeduplicationKey");

  await processJob(job);

  expect(removeDeduplicationKeySpy).toHaveBeenCalledOnce();
  expect(flowAddSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      queueName: "request-content-services",
      data: { step: "request", contentServicePlugin: "@repo/plugin-test" },
      opts: {
        delay: 300_000,
        deduplication: { id: "request-content-service-@repo/plugin-test" },
      },
    }),
  );
});
