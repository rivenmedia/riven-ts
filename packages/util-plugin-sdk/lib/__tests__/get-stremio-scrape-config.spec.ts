import { expect, it } from "vitest";

import {
  Episode,
  ItemRequest,
  Movie,
  Season,
  Show,
} from "../dto/entities/index.ts";
import { getStremioScrapeConfig } from "../helpers/get-stremio-scrape-config.ts";

const IMDB_ID = "tt0944947";

const createSeason = () => {
  const season = new Season();

  season.imdbId = IMDB_ID;
  season.number = 2;

  return season;
};

const createEpisode = () => {
  const episode = new Episode();

  episode.imdbId = IMDB_ID;
  episode.number = 5;
  episode.season = {
    loadProperty: async () => Promise.resolve(3),
  } as unknown as Episode["season"];

  return episode;
};

it("scrapes a movie by its IMDB ID alone", async () => {
  const movie = new Movie();

  movie.imdbId = "tt0133093";

  await expect(getStremioScrapeConfig(movie)).resolves.toStrictEqual({
    identifier: null,
    imdbId: "tt0133093",
    scrapeType: "movie",
  });
});

it("scrapes a show by its first episode", async () => {
  const show = new Show();

  show.imdbId = IMDB_ID;

  await expect(getStremioScrapeConfig(show)).resolves.toStrictEqual({
    identifier: ":1:1",
    imdbId: IMDB_ID,
    scrapeType: "series",
  });
});

it("scrapes a season by its first episode", async () => {
  await expect(getStremioScrapeConfig(createSeason())).resolves.toStrictEqual({
    identifier: ":2:1",
    imdbId: IMDB_ID,
    scrapeType: "series",
  });
});

it("scrapes an episode by its season and episode number", async () => {
  await expect(getStremioScrapeConfig(createEpisode())).resolves.toStrictEqual({
    identifier: ":3:5",
    imdbId: IMDB_ID,
    scrapeType: "series",
  });
});

it("rejects items without an IMDB ID", async () => {
  const movie = new Movie();

  movie.imdbId = null;

  await expect(getStremioScrapeConfig(movie)).rejects.toThrow(
    "IMDB ID is required for Stremio scrape config",
  );
});

it("rejects unsupported media item types", async () => {
  const item = Object.assign(Object.create(ItemRequest.prototype) as never, {
    imdbId: IMDB_ID,
  });

  await expect(getStremioScrapeConfig(item)).rejects.toThrow(
    "Unsupported media item type for Stremio identifier",
  );
});
