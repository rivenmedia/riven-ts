import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { flow } from "../producer.ts";
import { requestContentServiceProcessor } from "./request-content-service.processor.ts";

it('enqueues a content service plugin job when step is "request"', async ({
  createMockJob,
}) => {
  const job = await createMockJob({
    step: "request" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(true);

  const flowAddSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  await expect(
    requestContentServiceProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services: {} as never, plugins: new Map() },
    ),
  ).rejects.toThrow("WaitingChildren");

  expect(flowAddSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      queueName: expect.stringContaining("plugin-test"),
    }),
  );
});

it("processes movie items from child job results and sends success events", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "process" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "child-1": {
      movies: [
        { imdbId: "tt1111111", tmdbId: "111" },
        { imdbId: "tt2222222", tmdbId: "222" },
      ],
      shows: [],
      updateIntervalSeconds: null,
    },
  });

  vi.spyOn(job, "removeDeduplicationKey").mockResolvedValue(true);

  const sendEvent = vi.fn();

  const result = await requestContentServiceProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent, services, plugins: new Map() },
  );

  expect(result.count).toBe(2);
  expect(result.newItems).toBe(2);
  expect(sendEvent).toHaveBeenCalledTimes(2);
  expect(sendEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "riven.item-request.create.success",
    }),
  );
});

it("processes show items from child job results", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "process" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "child-1": {
      movies: [],
      shows: [{ imdbId: "tt3333333", tvdbId: "333", seasons: [1, 2] }],
      updateIntervalSeconds: null,
    },
  });

  vi.spyOn(job, "removeDeduplicationKey").mockResolvedValue(true);

  const sendEvent = vi.fn();

  const result = await requestContentServiceProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent, services, plugins: new Map() },
  );

  expect(result.count).toBe(1);
  expect(result.newItems).toBe(1);
});

it("sends error event for duplicate movie requests", async ({
  createMockJob,
  services,
}) => {
  // First request - create the item
  const firstJob = await createMockJob({
    step: "process" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(firstJob, "getChildrenValues").mockResolvedValue({
    "child-1": {
      movies: [{ imdbId: "tt4444444", tmdbId: "444" }],
      shows: [],
      updateIntervalSeconds: null,
    },
  });

  vi.spyOn(firstJob, "removeDeduplicationKey").mockResolvedValue(true);

  await requestContentServiceProcessor(
    { job: firstJob, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  // Second request - duplicate
  const secondJob = await createMockJob({
    step: "process" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(secondJob, "getChildrenValues").mockResolvedValue({
    "child-1": {
      movies: [{ imdbId: "tt4444444", tmdbId: "444" }],
      shows: [],
      updateIntervalSeconds: null,
    },
  });

  vi.spyOn(secondJob, "removeDeduplicationKey").mockResolvedValue(true);

  const sendEvent = vi.fn();

  const result = await requestContentServiceProcessor(
    { job: secondJob, scope: vi.fn() as never, token: "test-token" },
    { sendEvent, services, plugins: new Map() },
  );

  expect(result.newItems).toBe(0);
  expect(sendEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "riven.item-request.create.error.conflict",
    }),
  );
});

it("deduplicates items by external ID across children", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "process" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "child-1": {
      movies: [{ imdbId: "tt5555555", tmdbId: "555" }],
      shows: [],
      updateIntervalSeconds: null,
    },
    "child-2": {
      movies: [{ imdbId: "tt5555555", tmdbId: "555" }],
      shows: [],
      updateIntervalSeconds: null,
    },
  });

  vi.spyOn(job, "removeDeduplicationKey").mockResolvedValue(true);

  const sendEvent = vi.fn();

  const result = await requestContentServiceProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent, services, plugins: new Map() },
  );

  // Deduplicated by tmdbId key
  expect(result.count).toBe(1);
  expect(result.newItems).toBe(1);
});

it("re-enqueues with update interval when updateIntervalSeconds is set", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "process" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "child-1": {
      movies: [],
      shows: [],
      updateIntervalSeconds: 3600,
    },
  });

  vi.spyOn(job, "removeDeduplicationKey").mockResolvedValue(true);

  const { enqueueRequestContentService } =
    await import("./enqueue-request-content-service.ts");

  vi.mocked(enqueueRequestContentService);

  const result = await requestContentServiceProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  expect(result.count).toBe(0);
  expect(job.removeDeduplicationKey).toHaveBeenCalled();
});

it("skips movies with no valid external IDs", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "process" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "child-1": {
      movies: [{ imdbId: null, tmdbId: null }],
      shows: [],
      updateIntervalSeconds: null,
    },
  });

  vi.spyOn(job, "removeDeduplicationKey").mockResolvedValue(true);

  const sendEvent = vi.fn();

  const result = await requestContentServiceProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent, services, plugins: new Map() },
  );

  expect(result.count).toBe(0);
  expect(sendEvent).not.toHaveBeenCalled();
});

it("skips shows with no valid external IDs", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "process" as const,
    contentServicePlugin: "@repo/plugin-test",
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "child-1": {
      movies: [],
      shows: [{ imdbId: null, tvdbId: null }],
      updateIntervalSeconds: null,
    },
  });

  vi.spyOn(job, "removeDeduplicationKey").mockResolvedValue(true);

  const sendEvent = vi.fn();

  const result = await requestContentServiceProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent, services, plugins: new Map() },
  );

  expect(result.count).toBe(0);
  expect(sendEvent).not.toHaveBeenCalled();
});
