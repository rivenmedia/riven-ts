import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { flow } from "#message-queue/flows/producer.ts";

import { it } from "./helpers/test-context.ts";

it("creates an item request for an externally requested movie and processes it", async ({
  em,
  actor,
}) => {
  const addSpy = vi.spyOn(flow, "add");

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven-external.item-requested",
    item: {
      type: "movie",
      tmdbId: "603",
      imdbId: "tt0133093",
      externalRequestId: "42",
      requestedBy: "user@example.com",
    },
  });

  const itemRequest = await vi.waitFor(async () =>
    em.fork().findOneOrFail(ItemRequest, { tmdbId: "603" }),
  );

  expect(itemRequest).toMatchObject({
    type: "movie",
    imdbId: "tt0133093",
    externalRequestId: "42",
    requestedBy: "user@example.com",
  });

  await vi.waitFor(() => {
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queueName: "process-item-request",
        data: { itemRequestId: itemRequest.id, step: "request" },
      }),
    );
  });
});

it("does not request a show that has already been requested", async ({
  em,
  actor,
  indexedShowContext: { indexedShow },
}) => {
  const itemRequest = await indexedShow.itemRequest.loadOrFail();
  const sendSpy = vi.spyOn(actor, "send");

  expect.assert(itemRequest.tvdbId);
  expect(itemRequest.seasons ?? null).toBeNull();

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven-external.item-requested",
    item: { type: "show", tvdbId: itemRequest.tvdbId },
  });

  await vi.waitFor(() => {
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "riven.item-request.create.error.conflict",
      }),
    );
  });

  await expect(
    em.fork().count(ItemRequest, { tvdbId: itemRequest.tvdbId }),
  ).resolves.toBe(1);
  expect(sendSpy).not.toHaveBeenCalledWith(
    expect.objectContaining({ type: "riven.item-request.create.success" }),
  );
});

it("processes an item request when it is updated", async ({
  actor,
  indexedShowContext: { indexedShow },
}) => {
  const itemRequest = await indexedShow.itemRequest.loadOrFail();

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  expect(actor.getSnapshot().children.processItemRequest).toBeUndefined();

  actor.send({ type: "riven.item-request.update.success", item: itemRequest });

  expect(actor.getSnapshot().children.processItemRequest).toBeDefined();
});
