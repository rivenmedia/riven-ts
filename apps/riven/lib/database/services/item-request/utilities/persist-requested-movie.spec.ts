import { ItemRequest } from "@rivenmedia/plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@rivenmedia/plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@rivenmedia/plugin-sdk/schemas/events/item-request.create.error.event";

import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("returns the item request if processed successfully", async ({
  services: { itemRequestService },
}) => {
  const requestedId = "tt1234567";

  const result = await itemRequestService.requestMovie({
    imdbId: requestedId,
  });

  expect(result.item).toEqual(
    expect.objectContaining({
      imdbId: requestedId,
    }),
  );
});

it("sends an error event if the item processing fails", async ({
  services: { itemRequestService },
}) => {
  const requestedId = "1234";

  await expect(
    itemRequestService.requestMovie({
      imdbId: requestedId,
    }),
  ).rejects.toThrow(ItemRequestCreateError);
});

it("saves the external request ID if provided", async ({
  services: { itemRequestService },
}) => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  const result = await itemRequestService.requestMovie({
    imdbId: requestedId,
    externalRequestId,
  });

  expect(result.item).toEqual(
    expect.objectContaining<Partial<ItemRequest>>({
      externalRequestId,
    }),
  );
});

it("throws an ItemRequestCreateErrorConflict error if the item request already exists", async ({
  services: { itemRequestService },
}) => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  await itemRequestService.requestMovie({
    imdbId: requestedId,
    externalRequestId,
  });

  await expect(
    itemRequestService.requestMovie({
      imdbId: requestedId,
      externalRequestId,
    }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});
