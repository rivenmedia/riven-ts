import { Episode } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it } from "../../../__tests__/test-context.ts";

// The IndexedShowSeeder produces 6 non-special seasons of 10 episodes each,
// all requested + all in state "indexed" (no streams, no media files). The
// MediaItemStateSubscriber re-derives `state` on every flush from
// streams/filesystem entries, so tests must drive the helper's filters via
// fields the subscriber doesn't touch (season.isRequested, season.number)
// rather than by force-setting `state`.

it("returns all indexed+requested+non-special-season episodes of a fresh indexed show", async ({
  services,
  indexedShowContext: { indexedShow },
}) => {
  const result = await services.mediaItemService.getReindexEpisodesToProcess(
    indexedShow.id,
  );

  expect(result).toHaveLength(60);
  expect(result.every((item) => item instanceof Episode)).toBe(true);
});

it("excludes episodes whose season is a 'specials' season (number === 0)", async ({
  em,
  services,
  indexedShowContext: { indexedShow, seasons },
}) => {
  const targetSeason = seasons[0];

  if (!targetSeason) {
    throw new Error("seeded show has no seasons");
  }

  targetSeason.number = 0;
  await em.flush();

  const result = await services.mediaItemService.getReindexEpisodesToProcess(
    indexedShow.id,
  );

  // 60 total - 10 episodes from the now-special season = 50
  expect(result).toHaveLength(50);
});

it("excludes episodes whose parent season is not requested", async ({
  em,
  services,
  indexedShowContext: { indexedShow, seasons },
}) => {
  const targetSeason = seasons[0];

  if (!targetSeason) {
    throw new Error("seeded show has no seasons");
  }

  targetSeason.isRequested = false;
  await em.flush();

  const result = await services.mediaItemService.getReindexEpisodesToProcess(
    indexedShow.id,
  );

  // 60 total - 10 episodes from the unrequested season = 50
  expect(result).toHaveLength(50);
});

it("scopes results to the given show (does not bleed across shows)", async ({
  services,
  seeders: { seedIndexedShow },
  indexedShowContext: { indexedShow },
}) => {
  const otherShow = await seedIndexedShow();

  const result = await services.mediaItemService.getReindexEpisodesToProcess(
    indexedShow.id,
  );

  expect(result).toHaveLength(60);
  expect(
    result.every((episode) => episode.itemRequest !== otherShow.show.itemRequest),
  ).toBe(true);
});
