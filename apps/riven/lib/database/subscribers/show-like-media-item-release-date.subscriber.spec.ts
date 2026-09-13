import { DateTime } from "luxon";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/test-context.ts";

const indexedAt = DateTime.utc().toJSDate();

describe("episode year", () => {
  it("computes the episode year from its release date when no year is set", async ({
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({ indexedAt });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 2,
      indexedAt,
    });

    const releaseDate = DateTime.utc(2015, 6, 1);

    const episode = await episodeFactory.createOne({
      season,
      show,
      itemRequest: show.itemRequest,
      number: 3,
      isSpecial: false,
      releaseDate: releaseDate.toJSDate(),
      indexedAt,
    });

    expect(episode.year).toBe(releaseDate.year);
  });

  it("does not compute a year or cascade release dates when the episode has no release date", async ({
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({ releaseDate: null, indexedAt });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 1,
      releaseDate: null,
      indexedAt,
    });

    const episode = await episodeFactory.createOne({
      season,
      show,
      itemRequest: show.itemRequest,
      number: 1,
      isSpecial: false,
      releaseDate: null,
      indexedAt,
    });

    expect(episode.year).toBeNull();
    expect(season.releaseDate).toBeNull();
    expect(show.releaseDate).toBeNull();
  });
});

describe("season release date cascade", () => {
  it("sets the season release date and year from the first episode when the season has none", async ({
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({ indexedAt });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 2,
      releaseDate: null,
      indexedAt,
    });

    const releaseDate = DateTime.utc(2015, 6, 1);

    const episode = await episodeFactory.createOne({
      season,
      show,
      itemRequest: show.itemRequest,
      number: 1,
      isSpecial: false,
      releaseDate: releaseDate.toJSDate(),
      indexedAt,
    });

    expect(season.releaseDate).toStrictEqual(releaseDate.toJSDate());
    expect(season.year).toBe(episode.year);
  });

  it("does not update the season when the episode is not the first episode", async ({
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({ indexedAt });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 2,
      releaseDate: null,
      indexedAt,
    });

    await episodeFactory.createOne({
      season,
      show,
      itemRequest: show.itemRequest,
      number: 2,
      isSpecial: false,
      releaseDate: DateTime.utc(2015, 6, 1).toJSDate(),
      indexedAt,
    });

    expect(season.releaseDate).toBeNull();
  });
});

describe("show release date cascade", () => {
  it("sets the show release date and year from the first episode of the first season when the show has none", async ({
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({ releaseDate: null, indexedAt });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 1,
      releaseDate: null,
      indexedAt,
    });

    const releaseDate = DateTime.utc(2015, 6, 1);

    await episodeFactory.createOne({
      season,
      show,
      itemRequest: show.itemRequest,
      number: 1,
      isSpecial: false,
      releaseDate: releaseDate.toJSDate(),
      indexedAt,
    });

    expect(show.releaseDate).toStrictEqual(releaseDate.toJSDate());
    expect(show.year).toBe(releaseDate.year);
  });

  it("does not update the show when the season is not the first season", async ({
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({ releaseDate: null, indexedAt });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 2,
      releaseDate: null,
      indexedAt,
    });

    await episodeFactory.createOne({
      season,
      show,
      itemRequest: show.itemRequest,
      number: 1,
      isSpecial: false,
      releaseDate: DateTime.utc(2015, 6, 1).toJSDate(),
      indexedAt,
    });

    expect(show.releaseDate).toBeNull();
  });
});

describe("collection updates", () => {
  it("cascades the release date to a season when its first episode is moved there via the episodes collection", async ({
    em,
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({ releaseDate: null, indexedAt });

    const originSeason = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 2,
      releaseDate: null,
      indexedAt,
    });

    const destinationSeason = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 1,
      releaseDate: null,
      indexedAt,
    });

    const releaseDate = DateTime.utc(2015, 6, 1).toJSDate();

    const episode = await episodeFactory.createOne({
      season: originSeason,
      show,
      itemRequest: show.itemRequest,
      number: 1,
      isSpecial: false,
      releaseDate,
      indexedAt,
    });

    destinationSeason.episodes.add(episode);

    await em.flush();

    expect(destinationSeason.releaseDate).toStrictEqual(releaseDate);
    expect(show.releaseDate).toStrictEqual(releaseDate);
  });
});
