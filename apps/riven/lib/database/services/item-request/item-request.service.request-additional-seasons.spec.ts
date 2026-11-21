import { faker } from "@faker-js/faker";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

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
