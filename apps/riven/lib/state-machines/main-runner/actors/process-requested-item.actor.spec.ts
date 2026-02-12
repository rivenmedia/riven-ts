import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities/requests/item-request.entity";

import { expect, it, vi } from "vitest";

import { processRequestedItem } from "./process-requested-item.actor.ts";

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
      }) as never,
    });
  });
});

it("sends an error event if the item processing fails", async () => {
  const requestedId = "1234";
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
      type: "riven.media-item.creation.error",
      item: expect.objectContaining<Partial<ItemRequest>>({
        imdbId: requestedId,
      }) as never,
      error: expect.stringContaining("imdbId must match") as never,
    });
  });
});

it.todo("sends an already-exists event if the item already exists");

it.todo("does not save duplicate items");
