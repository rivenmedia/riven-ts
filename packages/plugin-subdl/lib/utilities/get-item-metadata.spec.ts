import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { expect, it } from "vitest";

import { getItemMetadata } from "./get-item-metadata.ts";

it("returns the IDs of a movie", async () => {
  const movie = new Movie();

  movie.tmdbId = "603";
  movie.imdbId = "tt0133093";

  await expect(getItemMetadata(movie)).resolves.toStrictEqual({
    type: "movie",
    tmdbId: "603",
    imdbId: "tt0133093",
    seasonNumber: undefined,
    episodeNumber: undefined,
  });
});

it("returns the IMDB ID, season and episode number of an episode", async () => {
  const episode = new Episode();

  episode.imdbId = null;
  episode.number = 5;
  episode.season = {
    loadProperty: async () => Promise.resolve(3),
  } as unknown as Episode["season"];

  await expect(getItemMetadata(episode)).resolves.toStrictEqual({
    type: "tv",
    tmdbId: undefined,
    imdbId: undefined,
    seasonNumber: 3,
    episodeNumber: 5,
  });
});

it.for([
  ["show", () => new Show()],
  ["season", () => new Season()],
] as const)("does not support a %s", async ([, createItem]) => {
  await expect(getItemMetadata(createItem())).resolves.toBeNull();
});
