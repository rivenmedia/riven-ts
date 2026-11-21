import { Episode } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("finds the episode within the given season", async ({
  services: { mediaItemService },
  indexedShowContext: { indexedShow, episodes },
}) => {
  // Episode numbers repeat across seasons, so the season number must be used
  const episode = episodes.find(
    ({ number, season }) => number === 3 && season.getProperty("number") === 2,
  );

  expect.assert(episode);

  const result = await mediaItemService.getEpisodeByShowTvdbId(
    indexedShow.tvdbId,
    { seasonNumber: 2, episodeNumber: 3 },
  );

  expect(result).toBeInstanceOf(Episode);
  expect(result?.id).toBe(episode.id);
});

it("returns null when the season has no such episode", async ({
  services: { mediaItemService },
  indexedShowContext: { indexedShow },
}) => {
  await expect(
    mediaItemService.getEpisodeByShowTvdbId(indexedShow.tvdbId, {
      seasonNumber: 1,
      episodeNumber: 999,
    }),
  ).resolves.toBeNull();
});
