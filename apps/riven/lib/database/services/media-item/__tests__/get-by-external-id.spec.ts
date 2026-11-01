import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { describe, expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

describe("getMediaItemByExternalId", () => {
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
});

describe("getSeasonByShowTvdbId", () => {
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
});

describe("getEpisodeByShowTvdbId", () => {
  it("finds the episode within the given season", async ({
    services: { mediaItemService },
    indexedShowContext: { indexedShow, episodes },
  }) => {
    // Episode numbers repeat across seasons, so the season number must be used
    const episode = episodes.find(
      ({ number, season }) =>
        number === 3 && season.getProperty("number") === 2,
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
});
