import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { expect, it, vi } from "vitest";
import { type ActorRefFrom, createEmptyActor } from "xstate";

import { processRequestedItem } from "../../request-content-services/utilities/process-requested-item.ts";

import type { mainRunnerMachine } from "../../../../state-machines/main-runner/index.ts";

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
  const parentRef = createEmptyActor() as ActorRefFrom<
    typeof mainRunnerMachine
  >;

  vi.spyOn(parentRef, "send");

  await expect(
    processRequestedItem({
      item: {
        imdbId: requestedId,
      },
      type: "movie",
      sendEvent: parentRef.send,
    }),
  ).rejects.toThrow();

  await vi.waitFor(() => {
    expect(parentRef).toHaveReceivedEvent({
      type: "riven.media-item.creation.error",
      item: expect.objectContaining<Partial<ItemRequest>>({
        imdbId: requestedId,
      }),
      error: expect.anything(),
    });
  });
});

it.todo("sends an already-exists event if the item already exists");

it.todo("does not save duplicate items");
