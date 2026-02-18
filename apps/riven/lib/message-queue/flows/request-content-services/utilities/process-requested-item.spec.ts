import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { expect, it, vi } from "vitest";

import { processRequestedItem } from "./process-requested-item.ts";

it("sends a success event if the item is processed successfully", async () => {
  const requestedId = "tt1234567";
  const sendEventSpy = vi.fn();

  await processRequestedItem({
    item: {
      imdbId: requestedId,
    },
    type: "movie",
    sendEvent: sendEventSpy,
  });

  await vi.waitFor(() => {
    expect(sendEventSpy).toHaveBeenCalledWith({
      type: "riven.item-request.creation.success",
      item: expect.objectContaining<Partial<ItemRequest>>({
        imdbId: requestedId,
        id: 1,
      }),
    });
  });
});

it("sends an error event if the item processing fails", async () => {
  const requestedId = "1234";
  const sendEventSpy = vi.fn();

  await expect(
    processRequestedItem({
      item: {
        imdbId: requestedId,
      },
      type: "movie",
      sendEvent: sendEventSpy,
    }),
  ).rejects.toThrow();

  await vi.waitFor(() => {
    expect(sendEventSpy).toHaveBeenCalledWith({
      type: "riven.media-item.creation.error",
      item: expect.objectContaining<Partial<ItemRequest>>({
        imdbId: requestedId,
      }),
      error: expect.stringContaining("imdbId must match"),
    });
  });
});

it("saves the external request ID if provided", async () => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";
  const sendEventSpy = vi.fn();

  const result = await processRequestedItem({
    item: {
      imdbId: requestedId,
      externalRequestId,
    },
    type: "movie",
    sendEvent: sendEventSpy,
  });

  expect(result.item).toEqual(
    expect.objectContaining<Partial<ItemRequest>>({
      externalRequestId,
    }),
  );
});

it.todo("sends an already-exists event if the item already exists");

it.todo("does not save duplicate items");
