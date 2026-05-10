import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { describe, expect } from "vitest";

import { it } from "../../../__tests__/test-context.ts";

describe("Show entity methods", () => {
  it("getEpisodes returns all non-special episodes by default", async ({
    completedShowContext: { completedShow },
  }) => {
    const episodes = await completedShow.getEpisodes();

    expect(episodes.length).toBeGreaterThan(0);
    // All episodes should be from non-special seasons
    for (const ep of episodes) {
      expect(ep.season.getProperty("number")).toBeGreaterThan(0);
    }
  });

  it("getEpisodes with includeSpecials=true returns all episodes", async ({
    completedShowContext: { completedShow },
  }) => {
    const episodes = await completedShow.getEpisodes(true);

    expect(episodes.length).toBeGreaterThan(0);
  });

  it("getStandardSeasons returns seasons ordered by number", async ({
    completedShowContext: { completedShow },
  }) => {
    const seasons = await completedShow.getStandardSeasons();

    expect(seasons.length).toBeGreaterThan(0);
    for (let i = 1; i < seasons.length; i++) {
      expect(seasons[i]!.number).toBeGreaterThan(seasons[i - 1]!.number);
    }
  });

  it("getStandardSeasons filters by state", async ({
    completedShowContext: { completedShow },
  }) => {
    const seasons = await completedShow.getStandardSeasons(["completed"]);

    for (const season of seasons) {
      expect(season.state).toBe("completed");
    }
  });

  it("getSpecialSeason returns undefined when no specials exist", async ({
    completedShowContext: { completedShow },
  }) => {
    const specialSeason = await completedShow.getSpecialSeason();

    expect(specialSeason).toBeUndefined();
  });

  it("getMediaEntries returns media entries for completed show", async ({
    completedShowContext: { completedShow },
  }) => {
    const mediaEntries = await completedShow.getMediaEntries();

    expect(mediaEntries.length).toBeGreaterThan(0);
    for (const entry of mediaEntries) {
      expect(entry.type).toBe("media");
    }
  });

  it("getExpectedFileCount returns expected count", async ({
    completedShowContext: { completedShow },
  }) => {
    const count = await completedShow.getExpectedFileCount();

    expect(count).toBeGreaterThan(0);
  });

  it("getIncompleteItems returns empty for completed show", async ({
    completedShowContext: { completedShow },
  }) => {
    const incompleteItems = await completedShow.getIncompleteItems();

    expect(incompleteItems).toHaveLength(0);
  });

  it("getIncompleteItems returns seasons with indexed episodes", async ({
    indexedShowContext: { indexedShow },
  }) => {
    const incompleteItems = await indexedShow.getIncompleteItems();

    expect(incompleteItems.length).toBeGreaterThan(0);
  });

  it("getUnrequestedItems returns unrequested seasons", async ({
    completedShowContext: { completedShow },
  }) => {
    const unrequestedItems = await completedShow.getUnrequestedItems();

    // All seasons are requested in completed show, so should be empty
    expect(unrequestedItems).toHaveLength(0);
  });

  it("getPrettyName includes tvdbId", async ({
    completedShowContext: { completedShow },
  }) => {
    const name = completedShow.getPrettyName();

    expect(name).toContain("{tvdb-");
    expect(name).toContain(completedShow.tvdbId);
  });

  it("getShow returns itself", async ({
    completedShowContext: { completedShow },
  }) => {
    const show = completedShow.getShow();

    expect(show.id).toBe(completedShow.id);
  });
});

describe("Season entity methods", () => {
  it("isSpecial returns false for non-zero season number", async ({
    completedShowContext: { seasons },
  }) => {
    for (const season of seasons) {
      expect(season.isSpecial).toBe(season.number === 0);
    }
  });

  it("getPrettyName pads season number", async ({
    completedShowContext: { seasons },
  }) => {
    const season = seasons[0]!;
    const name = season.getPrettyName();

    expect(name).toMatch(/^Season \d{2}$/);
  });

  it("getShow returns the parent show", async ({
    completedShowContext: { completedShow, seasons },
  }) => {
    const season = seasons[0]!;
    const show = await season.getShow();

    expect(show.id).toBe(completedShow.id);
  });

  it("getMediaEntries returns media entries for season episodes", async ({
    completedShowContext: { seasons },
  }) => {
    const season = seasons[0]!;
    const mediaEntries = await season.getMediaEntries();

    expect(mediaEntries.length).toBeGreaterThan(0);
    for (const entry of mediaEntries) {
      expect(entry.type).toBe("media");
    }
  });

  it("getExpectedFileCount returns episode count", async ({
    completedShowContext: { seasons },
  }) => {
    const season = seasons[0]!;
    const count = await season.getExpectedFileCount();

    expect(count).toBeGreaterThan(0);
  });

  it("getIncompleteItems returns empty for completed season", async ({
    completedShowContext: { seasons },
  }) => {
    const season = seasons[0]!;
    const incompleteItems = await season.getIncompleteItems();

    expect(incompleteItems).toHaveLength(0);
  });
});

describe("Episode entity methods", () => {
  it("getShow returns the grandparent show", async ({
    completedShowContext: { completedShow, episodes },
  }) => {
    const episode = episodes[0]!;
    const show = await episode.getShow();

    expect(show.id).toBe(completedShow.id);
  });

  it("getPrettyName returns formatted name with season and episode", async ({
    completedShowContext: { episodes },
  }) => {
    const episode = episodes[0]!;
    const prettyName = await episode.getPrettyName();

    expect(prettyName).toMatch(/s\d{2}e\d{2}$/);
    expect(prettyName).toContain("{tvdb-");
  });

  it("getMediaEntries returns media entries for episode", async ({
    completedShowContext: { episodes },
  }) => {
    const episode = episodes[0]!;
    const mediaEntries = await episode.getMediaEntries();

    expect(mediaEntries.length).toBeGreaterThan(0);
    for (const entry of mediaEntries) {
      expect(entry.type).toBe("media");
    }
  });

  it("getExpectedFileCount returns 1", async ({
    completedShowContext: { episodes },
  }) => {
    const episode = episodes[0]!;
    expect(episode.getExpectedFileCount()).toBe(1);
  });

  it("getIncompleteItems returns empty array", async ({
    completedShowContext: { episodes },
  }) => {
    const episode = episodes[0]!;
    expect(episode.getIncompleteItems()).toEqual([]);
  });
});

describe("MediaItem entity getters", () => {
  it("isReleased returns true for past release date", async ({
    completedMovieContext: { completedMovie },
  }) => {
    expect(completedMovie.isReleased).toBe(true);
  });

  it("isReleased returns false when releaseDate is null", async ({
    completedMovieContext: { completedMovie },
    em,
  }) => {
    em.assign(completedMovie, { releaseDate: null });

    expect(completedMovie.isReleased).toBe(false);
  });

  it("isAnime returns false for English language content", async ({
    completedMovieContext: { completedMovie },
  }) => {
    // Default factory creates English content
    expect(completedMovie.isAnime).toBe(false);
  });
});

describe("Movie entity methods", () => {
  it("getPrettyName includes tmdbId", async ({
    completedMovieContext: { completedMovie },
  }) => {
    const name = completedMovie.getPrettyName();

    expect(name).toContain("{tmdb-");
    expect(name).toContain(completedMovie.tmdbId);
  });

  it("getExpectedFileCount returns 1", async ({
    completedMovieContext: { completedMovie },
  }) => {
    expect(completedMovie.getExpectedFileCount()).toBe(1);
  });

  it("getIncompleteItems returns empty array", async ({
    completedMovieContext: { completedMovie },
  }) => {
    expect(completedMovie.getIncompleteItems()).toEqual([]);
  });

  it("getMediaEntries returns media entries for completed movie", async ({
    completedMovieContext: { completedMovie },
  }) => {
    const mediaEntries = await completedMovie.getMediaEntries();

    expect(mediaEntries.length).toBeGreaterThan(0);
  });
});

describe("ItemRequest entity methods", () => {
  it("externalIdsLabel includes IMDB and TMDB for movie type", async ({
    factories: { movieItemRequestFactory },
  }) => {
    const request = await movieItemRequestFactory.createOne({
      imdbId: "tt1234567",
      tmdbId: "12345",
      state: "requested",
    });

    expect(request.externalIdsLabel).toContain("IMDB: tt1234567");
    expect(request.externalIdsLabel).toContain("TMDB: 12345");
  });

  it("externalIdsLabel includes IMDB and TVDB for show type", async ({
    factories: { showItemRequestFactory },
  }) => {
    const request = await showItemRequestFactory.createOne({
      imdbId: "tt7654321",
      tvdbId: "54321",
      state: "requested",
    });

    expect(request.externalIdsLabel).toContain("IMDB: tt7654321");
    expect(request.externalIdsLabel).toContain("TVDB: 54321");
    // show type should not include TMDB
    expect(request.externalIdsLabel).not.toContainEqual(
      expect.stringContaining("TMDB"),
    );
  });

  it("externalIdsLabel handles missing external IDs", async ({
    factories: { movieItemRequestFactory },
  }) => {
    const request = await movieItemRequestFactory.createOne({
      imdbId: null,
      tmdbId: null,
      state: "requested",
    });

    expect(request.externalIdsLabel).toEqual([]);
  });
});

describe("IndexerService", () => {
  it("calculateReindexTime uses releaseDate for movies", async ({
    services: { indexerService },
    seeders: { seedCompletedMovie },
  }) => {
    const { movie } = await seedCompletedMovie();

    const { reindexTime, isFallback } =
      await indexerService.calculateReindexTime(movie);

    expect(reindexTime).toBeDefined();
    expect(isFallback).toBe(!movie.releaseDate);
  });

  it("calculateReindexTime uses nextAirDate for shows", async ({
    services: { indexerService },
    seeders: { seedCompletedShow },
  }) => {
    const { show } = await seedCompletedShow();

    const { reindexTime, isFallback } =
      await indexerService.calculateReindexTime(show);

    expect(reindexTime).toBeDefined();
    expect(isFallback).toBe(!show.nextAirDate);
  });
});
