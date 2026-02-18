import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreationErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.creation.error.conflict.event";
import { ItemRequestCreationError } from "@repo/util-plugin-sdk/schemas/events/item-request.creation.error.event";

import { expect, it } from "vitest";

import { processRequestedItem } from "./process-requested-item.ts";

it("returns the item request if processed successfully", async () => {
  const requestedId = "tt1234567";

  const result = await processRequestedItem({
    item: {
      imdbId: requestedId,
    },
    type: "movie",
  });

  expect(result.item).toEqual(
    expect.objectContaining({
      id: 1,
      imdbId: requestedId,
    }),
  );
});

it("sends an error event if the item processing fails", async () => {
  const requestedId = "1234";

  await expect(
    processRequestedItem({
      item: {
        imdbId: requestedId,
      },
      type: "movie",
    }),
  ).rejects.toThrow(ItemRequestCreationError);
});

it("saves the external request ID if provided", async () => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  const result = await processRequestedItem({
    item: {
      imdbId: requestedId,
      externalRequestId,
    },
    type: "movie",
  });

  expect(result.item).toEqual(
    expect.objectContaining<Partial<ItemRequest>>({
      externalRequestId,
    }),
  );
});

it("throws an ItemRequestCreationErrorConflict error if the item request already exists", async () => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  await processRequestedItem({
    item: {
      imdbId: requestedId,
      externalRequestId,
    },
    type: "movie",
  });

  await expect(
    processRequestedItem({
      item: {
        imdbId: requestedId,
        externalRequestId,
      },
      type: "movie",
    }),
  ).rejects.toThrow(ItemRequestCreationErrorConflict);
});
