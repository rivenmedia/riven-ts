import {
  Episode,
  ItemRequest,
  Season,
} from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("creates a request for the given seasons of a new show", async ({
  em,
  services: { itemRequestService },
}) => {
  const result = await itemRequestService.requestShow({
    tvdbId: "121361",
    imdbId: "tt0944947",
    seasons: [1, 2],
    requestedBy: "user@example.com",
    externalRequestId: "42",
  });

  expect(result.requestType).toBe("create");
  await expect(
    em.fork().findOneOrFail(ItemRequest, { tvdbId: "121361" }),
  ).resolves.toMatchObject({
    type: "show",
    state: "requested",
    imdbId: "tt0944947",
    seasons: [1, 2],
    requestedBy: "user@example.com",
    externalRequestId: "42",
  });
});

it("rejects a request for a show without valid IDs", async ({
  services: { itemRequestService },
}) => {
  await expect(
    itemRequestService.requestShow({ imdbId: "1234" }),
  ).rejects.toThrow(ItemRequestCreateError);
});

it("rejects a repeated request for every season of a show", async ({
  services: { itemRequestService },
}) => {
  await itemRequestService.requestShow({ tvdbId: "121361" });

  await expect(
    itemRequestService.requestShow({ tvdbId: "121361" }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});

it("rejects a request for seasons that have all been requested already", async ({
  services: { itemRequestService },
}) => {
  await itemRequestService.requestShow({ tvdbId: "121361", seasons: [1, 2] });

  await expect(
    itemRequestService.requestShow({ tvdbId: "121361", seasons: [2] }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});

it("adds newly requested seasons to an existing request and marks them as requested", async ({
  em,
  services: { itemRequestService },
  seeders: { seedPartiallyRequestedShow },
}) => {
  const { show } = await seedPartiallyRequestedShow();
  const itemRequest = await show.itemRequest.loadOrFail();

  expect.assert(itemRequest.tvdbId);
  expect(itemRequest.seasons).toStrictEqual([1, 2, 3]);

  const result = await itemRequestService.requestShow({
    tvdbId: itemRequest.tvdbId,
    seasons: [5, 4],
  });

  expect(result.requestType).toBe("update");

  const fork = em.fork();

  await expect(
    fork.findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({ seasons: [1, 2, 3, 4, 5] });

  const seasons = await fork.find(
    Season,
    { show: show.id },
    { orderBy: { number: "asc" } },
  );

  expect(
    seasons.map(({ number, isRequested }) => [number, isRequested]),
  ).toStrictEqual([
    [1, true],
    [2, true],
    [3, true],
    [4, true],
    [5, true],
    [6, false],
  ]);
  await expect(
    fork.count(Episode, {
      season: { show: show.id, number: { $in: [4, 5] } },
      isRequested: false,
    }),
  ).resolves.toBe(0);
  await expect(
    fork.count(Episode, {
      season: { show: show.id, number: 6 },
      isRequested: true,
    }),
  ).resolves.toBe(0);
});
