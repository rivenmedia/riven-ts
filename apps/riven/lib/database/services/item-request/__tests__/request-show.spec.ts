import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { faker } from "@faker-js/faker";
import { describe, expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

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

describe("when the item request already exists", () => {
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
});

describe("when additional seasons are requested for an existing item request", () => {
  it("updates the existing request's seasons", async ({
    services: { itemRequestService },
  }) => {
    const requestedId = faker.string.numeric({ length: { min: 1, max: 10 } });
    const externalRequestId = "external-req-123";

    await itemRequestService.requestShow({
      tvdbId: requestedId,
      externalRequestId,
      seasons: [1],
    });

    const updatedRequest = await itemRequestService.requestShow({
      tvdbId: requestedId,
      externalRequestId,
      seasons: [1, 2],
    });

    expect(updatedRequest.item.seasons).toStrictEqual([1, 2]);
  });

  it("marks the newly requested items as requested", async ({
    em,
    seeders: { seedPartiallyRequestedShow },
    services: { itemRequestService },
  }) => {
    const { show, episodes } = await seedPartiallyRequestedShow();

    expect.assert(episodes);

    const { item: updatedRequest } = await itemRequestService.requestShow({
      tvdbId: show.tvdbId,
      seasons: [1, 2, 3, 4],
    });

    const newlyRequestedItems = await updatedRequest.mediaItems.loadItems({
      where: {
        isRequested: true,
        state: "indexed",
        type: {
          $in: ["season", "episode"],
        },
      },
    });

    expect(newlyRequestedItems).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "season",
          number: 4,
        }),
        ...episodes
          .filter((episode) => episode.season.getProperty("number") === 4)
          .map((episode) =>
            expect.objectContaining({
              type: "episode",
              absoluteNumber: episode.absoluteNumber,
            }),
          ),
      ]),
    );

    expect(updatedRequest.state).toBe("processing");

    await em.refreshOrFail(show);

    expect(show.state).toBe("partially_completed");
  });
});
