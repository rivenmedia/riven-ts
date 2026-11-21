import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { faker } from "@faker-js/faker";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import type { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

it("returns the item request if processed successfully", async ({
  services: { itemRequestService },
}) => {
  const requestedId = faker.string.numeric({ length: { min: 1, max: 10 } });

  const result = await itemRequestService.requestShow({
    tvdbId: requestedId,
  });

  expect(result.item).toStrictEqual(
    expect.objectContaining({
      tvdbId: requestedId,
    }),
  );
});

it("throws an error event if the item processing fails", async ({
  services: { itemRequestService },
}) => {
  const requestedId = "invalid-tvdb-id";

  await expect(
    itemRequestService.requestShow({
      tvdbId: requestedId,
    }),
  ).rejects.toThrow(ItemRequestCreateError);
});

it("saves the external request ID if provided", async ({
  services: { itemRequestService },
}) => {
  const requestedId = faker.string.numeric({ length: { min: 1, max: 10 } });
  const externalRequestId = "external-req-123";

  const result = await itemRequestService.requestShow({
    tvdbId: requestedId,
    externalRequestId,
  });

  expect(result.item).toStrictEqual(
    expect.objectContaining<Partial<ItemRequest>>({
      externalRequestId,
    }),
  );
});
