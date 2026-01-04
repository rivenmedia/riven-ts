import { RequestedItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { expect, it, vi } from "vitest";
import { createActor, createEmptyActor } from "xstate";

import { processRequestedItem } from "./process-requested-item.actor.ts";

it("sends a success event if the item is processed successfully", async () => {
  const requestedId = "tt1234567";
  const parentRef = createEmptyActor();
  const sendSpy = vi.spyOn(parentRef, "send");

  const actor = createActor(processRequestedItem, {
    input: {
      item: {
        imdbId: requestedId,
      },
      parentRef,
    },
  });

  actor.start();

  await vi.waitFor(() => {
    expect(sendSpy).toHaveBeenCalledWith({
      type: "riven.media-item.creation.success",
      item: expect.objectContaining<Partial<RequestedItem>>({
        imdbId: requestedId,
        lastState: "Requested",
        id: expect.any(Number),
      }) as never,
    });
  });
});

it("sends an error event if the item processing fails", async () => {
  const requestedId = "1234";
  const parentRef = createEmptyActor();
  const sendSpy = vi.spyOn(parentRef, "send");

  const actor = createActor(processRequestedItem, {
    input: {
      item: {
        imdbId: requestedId,
      },
      parentRef,
    },
  });

  actor.start();

  await vi.waitFor(() => {
    expect(sendSpy).toHaveBeenCalledWith({
      type: "riven.media-item.creation.error",
      item: expect.objectContaining<Partial<RequestedItem>>({
        imdbId: requestedId,
      }) as never,
      error: expect.anything(),
    });
  });
});
