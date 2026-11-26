import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("finds a movie by its TMDB ID", async ({
  services: { mediaItemService },
  factories: { movieFactory },
}) => {
  const movie = await movieFactory.createOne();

  const result = await mediaItemService.getMediaItemByExternalId(
    movie.tmdbId,
    "movie",
  );

  expect(result).toBeInstanceOf(Movie);
  expect(result?.id).toBe(movie.id);
});

it("finds a show by its TVDB ID", async ({
  services: { mediaItemService },
  indexedShowContext: { indexedShow },
}) => {
  const result = await mediaItemService.getMediaItemByExternalId(
    indexedShow.tvdbId,
    "show",
  );

  expect(result).toBeInstanceOf(Show);
  expect(result?.id).toBe(indexedShow.id);
});

it("returns null when no item matches", async ({
  services: { mediaItemService },
}) => {
  await expect(
    mediaItemService.getMediaItemByExternalId("does-not-exist", "movie"),
  ).resolves.toBeNull();
});
