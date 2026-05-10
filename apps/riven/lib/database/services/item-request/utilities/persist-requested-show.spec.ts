import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("returns the item request if a new show is processed successfully", async ({
  services: { itemRequestService },
}) => {
  const result = await itemRequestService.requestShow({
    imdbId: "tt1234567",
    seasons: [1, 2],
  });

  expect(result.requestType).toBe("create");
  expect(result.item).toEqual(
    expect.objectContaining({
      imdbId: "tt1234567",
      type: "show",
      seasons: [1, 2],
    }),
  );
});

it("sends an error event if validation fails", async ({
  services: { itemRequestService },
}) => {
  await expect(
    itemRequestService.requestShow({
      imdbId: "1234",
    }),
  ).rejects.toThrow(ItemRequestCreateError);
});

it("saves the external request ID if provided", async ({
  services: { itemRequestService },
}) => {
  const externalRequestId = "external-req-456";

  const result = await itemRequestService.requestShow({
    imdbId: "tt1234568",
    externalRequestId,
    seasons: [1],
  });

  expect(result.item).toEqual(
    expect.objectContaining<Partial<ItemRequest>>({
      externalRequestId,
    }),
  );
});

it("throws ItemRequestCreateErrorConflict if all requested seasons already exist", async ({
  services: { itemRequestService },
}) => {
  await itemRequestService.requestShow({
    imdbId: "tt1234569",
    seasons: [1, 2],
  });

  await expect(
    itemRequestService.requestShow({
      imdbId: "tt1234569",
      seasons: [1, 2],
    }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});

it("updates with new seasons when requesting additional seasons for an existing show", async ({
  services: { itemRequestService },
}) => {
  await itemRequestService.requestShow({
    imdbId: "tt2345678",
    seasons: [1, 2],
  });

  const result = await itemRequestService.requestShow({
    imdbId: "tt2345678",
    seasons: [2, 3],
  });

  expect(result.requestType).toBe("update");
  expect(result.item.seasons).toEqual([1, 2, 3]);
});

it("creates a show request with tvdbId only", async ({
  services: { itemRequestService },
}) => {
  const result = await itemRequestService.requestShow({
    tvdbId: "12345",
    seasons: [1],
  });

  expect(result.requestType).toBe("create");
  expect(result.item).toEqual(
    expect.objectContaining({
      tvdbId: "12345",
      type: "show",
    }),
  );
});

it("creates a show request with tmdbId only", async ({
  services: { itemRequestService },
}) => {
  const result = await itemRequestService.requestShow({
    tmdbId: "67890",
    seasons: [1],
  });

  expect(result.requestType).toBe("create");
  expect(result.item).toEqual(
    expect.objectContaining({
      tmdbId: "67890",
      type: "show",
    }),
  );
});

it("creates a show request without seasons", async ({
  services: { itemRequestService },
}) => {
  const result = await itemRequestService.requestShow({
    imdbId: "tt3456789",
  });

  expect(result.requestType).toBe("create");
  expect(result.item.seasons).toBeNull();
});

it("marks unrequested season items as requested when adding seasons to an indexed show", async ({
  services: { itemRequestService, indexerService },
}) => {
  // Create a show request with season 1
  const { item } = await itemRequestService.requestShow({
    tvdbId: "99001",
    seasons: [1],
  });

  // Index the show with 2 seasons so the Season entities exist
  await indexerService.indexItem({
    id: item.id,
    title: "Multi-Season Show",
    contentRating: "tv-14",
    genres: [],
    type: "show",
    network: "Test Network",
    seasons: {
      1: {
        number: 1,
        title: "Season 1",
        episodes: [
          {
            absoluteNumber: 1,
            contentRating: "tv-14",
            number: 1,
            airedAt: null,
            title: "Ep1",
            runtime: 45,
          },
        ],
      },
      2: {
        number: 2,
        title: "Season 2",
        episodes: [
          {
            absoluteNumber: 2,
            contentRating: "tv-14",
            number: 1,
            airedAt: null,
            title: "S2Ep1",
            runtime: 45,
          },
        ],
      },
    },
    status: "ended",
  });

  // Now request additional season 2
  const result = await itemRequestService.requestShow({
    tvdbId: "99001",
    seasons: [2],
  });

  expect(result.requestType).toBe("update");
  expect(result.item.seasons).toEqual([1, 2]);
});

it("detects conflict by tvdbId when show was originally created with imdbId", async ({
  services: { itemRequestService },
}) => {
  await itemRequestService.requestShow({
    imdbId: "tt4567890",
    tvdbId: "99999",
    seasons: [1],
  });

  await expect(
    itemRequestService.requestShow({
      tvdbId: "99999",
      seasons: [1],
    }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});
