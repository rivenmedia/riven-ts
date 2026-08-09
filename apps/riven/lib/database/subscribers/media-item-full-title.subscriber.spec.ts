import { DateTime } from "luxon";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/test-context.ts";

const indexedAt = DateTime.utc().toJSDate();

describe("on create", () => {
  it("sets the full title for a movie", async ({
    factories: { movieFactory },
  }) => {
    const movie = await movieFactory.createOne({
      title: "The Great Movie",
      indexedAt,
    });

    expect(movie.fullTitle).toBe("The Great Movie");
  });

  it("sets the full title for a show", async ({
    factories: { showFactory },
  }) => {
    const show = await showFactory.createOne({
      title: "The Great Show",
      indexedAt,
    });

    expect(show.fullTitle).toBe("The Great Show");
  });

  it("sets the full title for a season", async ({
    factories: { showFactory, seasonFactory },
  }) => {
    const show = await showFactory.createOne({
      title: "The Great Show",
      indexedAt,
    });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 3,
      indexedAt,
    });

    expect(season.fullTitle).toBe("The Great Show - S03");
  });

  it("sets the full title for an episode", async ({
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({
      title: "The Great Show",
      indexedAt,
    });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 3,
      indexedAt,
    });

    const episode = await episodeFactory.createOne({
      season,
      show,
      itemRequest: show.itemRequest,
      number: 5,
      title: "The Great Episode",
      indexedAt,
    });

    expect(episode.fullTitle).toBe(
      "The Great Show - S03E05 - The Great Episode",
    );
  });
});

describe("on update", () => {
  it("updates the full title when a movie's title changes", async ({
    em,
    factories: { movieFactory },
  }) => {
    const movie = await movieFactory.createOne({
      title: "The Great Movie",
      indexedAt,
    });

    movie.title = "The Greater Movie";

    await em.flush();

    expect(movie.fullTitle).toBe("The Greater Movie");
  });

  it("updates the full title when a show's title changes", async ({
    em,
    factories: { showFactory },
  }) => {
    const show = await showFactory.createOne({
      title: "The Great Show",
      indexedAt,
    });

    show.title = "The Greater Show";

    await em.flush();

    expect(show.fullTitle).toBe("The Greater Show");
  });

  it("updates the full title when a season's number changes", async ({
    em,
    factories: { showFactory, seasonFactory },
  }) => {
    const show = await showFactory.createOne({
      title: "The Great Show",
      indexedAt,
    });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 3,
      indexedAt,
    });

    season.number = 4;

    await em.flush();

    expect(season.fullTitle).toBe("The Great Show - S04");
  });

  it("updates the full title when an episode's number or title changes", async ({
    em,
    factories: { showFactory, seasonFactory, episodeFactory },
  }) => {
    const show = await showFactory.createOne({
      title: "The Great Show",
      indexedAt,
    });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      number: 3,
      indexedAt,
    });

    const episode = await episodeFactory.createOne({
      season,
      show,
      itemRequest: show.itemRequest,
      number: 5,
      title: "The Great Episode",
      indexedAt,
    });

    episode.number = 6;

    await em.flush();

    expect(episode.fullTitle).toBe(
      "The Great Show - S03E06 - The Great Episode",
    );

    episode.title = "The Greatest Episode";

    await em.flush();

    expect(episode.fullTitle).toBe(
      "The Great Show - S03E06 - The Greatest Episode",
    );
  });
});
