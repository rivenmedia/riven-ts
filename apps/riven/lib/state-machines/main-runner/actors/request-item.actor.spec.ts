import { expect, vi } from "vitest";
import { createActor, waitFor } from "xstate";

import { it } from "../../../__tests__/test-context.ts";
import { requestItem } from "./request-item.actor.ts";

it("sends success event after creating a movie request", async ({
  services,
}) => {
  const sendSpy = vi.fn();

  vi.spyOn(services.itemRequestService, "requestMovie").mockResolvedValue({
    item: { id: "movie-1", type: "movie" },
  } as never);

  const actor = createActor(requestItem, {
    input: {
      parentRef: { send: sendSpy } as never,
      item: { type: "movie", title: "Test Movie", tmdbId: 123 } as never,
    },
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(services.itemRequestService.requestMovie).toHaveBeenCalled();
  expect(sendSpy).toHaveBeenCalledWith({
    type: "riven.item-request.create.success",
    item: expect.objectContaining({ id: "movie-1" }),
  });
});

it("sends success event after creating a show request", async ({
  services,
}) => {
  const sendSpy = vi.fn();

  vi.spyOn(services.itemRequestService, "requestShow").mockResolvedValue({
    item: { id: "show-1", type: "show" },
  } as never);

  const actor = createActor(requestItem, {
    input: {
      parentRef: { send: sendSpy } as never,
      item: { type: "show", title: "Test Show", tvdbId: 456 } as never,
    },
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(services.itemRequestService.requestShow).toHaveBeenCalled();
  expect(sendSpy).toHaveBeenCalledWith({
    type: "riven.item-request.create.success",
    item: expect.objectContaining({ id: "show-1" }),
  });
});

it("sends error event when ItemRequestCreateError is thrown", async ({
  services,
}) => {
  const sendSpy = vi.fn();
  const { ItemRequestCreateError } =
    await import("@repo/util-plugin-sdk/schemas/events/item-request.create.error.event");

  const error = new ItemRequestCreateError({
    type: "riven.item-request.create.error",
    message: "Request failed",
  } as never);

  vi.spyOn(services.itemRequestService, "requestMovie").mockRejectedValue(
    error,
  );

  const actor = createActor(requestItem, {
    input: {
      parentRef: { send: sendSpy } as never,
      item: { type: "movie", title: "Test Movie", tmdbId: 123 } as never,
    },
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(sendSpy).toHaveBeenCalledWith(error.payload);
});

it("sends conflict error event when ItemRequestCreateErrorConflict is thrown", async ({
  services,
}) => {
  const sendSpy = vi.fn();
  const { ItemRequestCreateErrorConflict } =
    await import("@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event");

  const error = new ItemRequestCreateErrorConflict({
    type: "riven.item-request.create.error.conflict",
    message: "Conflict",
  } as never);

  vi.spyOn(services.itemRequestService, "requestMovie").mockRejectedValue(
    error,
  );

  const actor = createActor(requestItem, {
    input: {
      parentRef: { send: sendSpy } as never,
      item: { type: "movie", title: "Test Movie", tmdbId: 123 } as never,
    },
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(sendSpy).toHaveBeenCalledWith(error.payload);
});

it("rethrows unexpected errors", async ({ services }) => {
  vi.spyOn(services.itemRequestService, "requestMovie").mockRejectedValue(
    new Error("Unexpected"),
  );

  const actor = createActor(requestItem, {
    input: {
      parentRef: { send: vi.fn() } as never,
      item: { type: "movie", title: "Test Movie", tmdbId: 123 } as never,
    },
  });

  const errorPromise = new Promise<unknown>((resolve) => {
    actor.subscribe({
      error: (err) => resolve(err),
    });
  });

  actor.start();

  const error = await errorPromise;
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toBe("Unexpected");
});
