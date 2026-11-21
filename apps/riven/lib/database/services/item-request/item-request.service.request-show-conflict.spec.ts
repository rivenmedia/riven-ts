import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";

import { faker } from "@faker-js/faker";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("throws an ItemRequestCreateErrorConflict error if the item request is for all seasons", async ({
  services: { itemRequestService },
}) => {
  const requestedId = faker.string.numeric({ length: { min: 1, max: 10 } });
  const externalRequestId = "external-req-123";

  await itemRequestService.requestShow({
    tvdbId: requestedId,
    externalRequestId,
  });

  await expect(
    itemRequestService.requestShow({
      tvdbId: requestedId,
      externalRequestId,
    }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});

it("throws an ItemRequestCreateErrorConflict error if the new request has identical seasons to the existing request", async ({
  services: { itemRequestService },
}) => {
  const requestedId = faker.string.numeric({ length: { min: 1, max: 10 } });
  const externalRequestId = "external-req-123";

  await itemRequestService.requestShow({
    tvdbId: requestedId,
    externalRequestId,
    seasons: [1],
  });

  await expect(
    itemRequestService.requestShow({
      tvdbId: requestedId,
      externalRequestId,
      seasons: [1],
    }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});
