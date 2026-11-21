import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { flow } from "#message-queue/flows/producer.ts";

import { enqueueProcessItemRequest } from "./enqueue-process-item-request.ts";

it("creates a root job to index the item request", async ({
  factories: { movieItemRequestFactory },
}) => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);
  const itemRequest = await movieItemRequestFactory.createOne();

  await enqueueProcessItemRequest({ item: itemRequest });

  expect(addSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      name: `Indexing [${itemRequest.externalIdsLabel.join(" | ")}]`,
      queueName: "process-item-request",
      data: { itemRequestId: itemRequest.id, step: "request" },
      opts: {
        deduplication: { id: `process-item-request-${itemRequest.id}` },
      },
    }),
  );
});

it("creates a delayed root job to reindex the item request", async ({
  factories: { movieItemRequestFactory },
}) => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);
  const itemRequest = await movieItemRequestFactory.createOne();

  await enqueueProcessItemRequest(
    { item: itemRequest },
    {
      delay: 60_000,
      deduplication: { id: `reindex-item-${itemRequest.id}`, ttl: 60_000 },
    },
  );

  expect(addSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      name: `Reindexing [${itemRequest.externalIdsLabel.join(" | ")}]`,
      opts: {
        delay: 60_000,
        deduplication: { id: `reindex-item-${itemRequest.id}`, ttl: 60_000 },
      },
    }),
  );
});
