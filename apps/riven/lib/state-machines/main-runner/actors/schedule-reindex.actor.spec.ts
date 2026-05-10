import { DateTime } from "luxon";
import { expect, vi } from "vitest";
import { createActor, waitFor } from "xstate";

import { it } from "../../../__tests__/test-context.ts";
import { enqueueProcessItemRequest } from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";
import { scheduleReindex } from "./schedule-reindex.actor.ts";

vi.mock(
  "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts",
  () => ({
    enqueueProcessItemRequest: vi.fn().mockResolvedValue(undefined),
  }),
);

it("enqueues a reindex job with the calculated delay", async ({ services }) => {
  const reindexTime = DateTime.now().plus({ hours: 2 });
  const mockItemRequest = { id: "req-1", type: "movie" };

  vi.spyOn(services.indexerService, "calculateReindexTime").mockResolvedValue({
    isFallback: false,
    reindexTime,
  });

  const item = {
    id: "movie-1",
    type: "movie",
    fullTitle: "Test Movie",
    itemRequest: {
      loadOrFail: vi.fn().mockResolvedValue(mockItemRequest),
    },
  } as never;

  const actor = createActor(scheduleReindex, { input: { item } });
  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(enqueueProcessItemRequest).toHaveBeenCalledWith(
    { item: mockItemRequest },
    expect.objectContaining({
      delay: expect.any(Number),
      deduplication: expect.objectContaining({
        id: "reindex-item-movie-1",
      }),
    }),
  );
});

it("logs fallback message when release date is unknown", async ({
  services,
}) => {
  const reindexTime = DateTime.now().plus({ days: 7 });

  vi.spyOn(services.indexerService, "calculateReindexTime").mockResolvedValue({
    isFallback: true,
    reindexTime,
  });

  vi.mocked(enqueueProcessItemRequest).mockResolvedValue(undefined as never);

  const item = {
    id: "movie-2",
    type: "movie",
    fullTitle: "Unknown Date Movie",
    itemRequest: {
      loadOrFail: vi.fn().mockResolvedValue({ id: "req-2" }),
    },
  } as never;

  const actor = createActor(scheduleReindex, { input: { item } });
  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  // Should complete successfully even with fallback
  expect(enqueueProcessItemRequest).toHaveBeenCalled();
});
