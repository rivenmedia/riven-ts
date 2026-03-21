import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { expect, it } from "vitest";

import { persistRequestedMovie } from "./persist-requested-movie.ts";

it("returns the item request if processed successfully", async () => {
  const requestedId = "tt1234567";

  const result = await persistRequestedMovie({
    imdbId: requestedId,
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
    persistRequestedMovie({
      imdbId: requestedId,
    }),
  ).rejects.toThrow(ItemRequestCreateError);
});

it("saves the external request ID if provided", async () => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  const result = await persistRequestedMovie({
    imdbId: requestedId,
    externalRequestId,
  });

  expect(result.item).toEqual(
    expect.objectContaining<Partial<ItemRequest>>({
      externalRequestId,
    }),
  );
});

it("throws an ItemRequestCreateErrorConflict error if the item request already exists", async () => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  await persistRequestedMovie({
    imdbId: requestedId,
    externalRequestId,
  });

  await expect(
    persistRequestedMovie({
      imdbId: requestedId,
      externalRequestId,
    }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});
