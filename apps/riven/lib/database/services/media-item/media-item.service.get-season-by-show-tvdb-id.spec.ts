import { Season } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("finds the season of the given show", async ({
  services: { mediaItemService },
  seeders: { seedIndexedShow },
}) => {
  // Only destructure the first show; the second emulates an unrelated item
  const [{ show, seasons }] = await seedIndexedShow(2);
  const season = seasons?.find(({ number }) => number === 2);

  expect.assert(season);

  const result = await mediaItemService.getSeasonByShowTvdbId(show.tvdbId, 2);

  expect(result).toBeInstanceOf(Season);
  expect(result?.id).toBe(season.id);
});

it("returns null when the show has no such season", async ({
  services: { mediaItemService },
  indexedShowContext: { indexedShow },
}) => {
  await expect(
    mediaItemService.getSeasonByShowTvdbId(indexedShow.tvdbId, 999),
  ).resolves.toBeNull();
});
