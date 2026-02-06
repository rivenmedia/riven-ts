import { RequestedItem } from "@repo/util-plugin-sdk/dto/entities";

import { expect, it, vi } from "vitest";
import { type ActorRefFrom, createEmptyActor } from "xstate";

import { processRequestedItem } from "./process-requested-item.actor.ts";

import type { mainRunnerMachine } from "../index.ts";

it("sends a success event if the item is processed successfully", async () => {
  const requestedId = "tt1234567";
  const parentRef = createEmptyActor() as ActorRefFrom<
    typeof mainRunnerMachine
  >;

  vi.spyOn(parentRef, "send");

  await processRequestedItem({
    item: {
      imdbId: requestedId,
    },
    type: "movie",
    sendEvent: parentRef.send,
  });

  await vi.waitFor(() => {
    expect(parentRef).toHaveReceivedEvent({
      type: "riven.media-item.creation.success",
      item: expect.objectContaining<Partial<RequestedItem>>({
        imdbId: requestedId,
        state: "Requested",
        id: 1,
      }) as never,
    });
  });
});

it("sends an error event if the item processing fails", async () => {
  const requestedId = "1234";
  const parentRef = createEmptyActor() as ActorRefFrom<
    typeof mainRunnerMachine
  >;

  vi.spyOn(parentRef, "send");

  await processRequestedItem({
    item: {
      imdbId: requestedId,
    },
    type: "movie",
    sendEvent: parentRef.send,
  });

  await vi.waitFor(() => {
    expect(parentRef).toHaveReceivedEvent({
      type: "riven.media-item.creation.error",
      item: expect.objectContaining<Partial<RequestedItem>>({
        imdbId: requestedId,
      }) as never,
      error: expect.anything(),
    });
  });
});

it.todo("sends an already-exists event if the item already exists");

it.todo("does not save duplicate items");
