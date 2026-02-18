import { ItemRequest, Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";

import { expect, it } from "vitest";

import { database } from "../../../../database/database.ts";
import { persistMovieIndexerData } from "./persist-movie-indexer-data.ts";

it("returns the media item if processed successfully", async ({}) => {
  const requestedId = "tt1234567";

  const em = database.orm.em.fork();
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "test-user",
    imdbId: requestedId,
    tmdbId: "1234",
    type: "movie",
    state: "requested",
  });

  await em.flush();

  const result = await persistMovieIndexerData({
    item: {
      id: itemRequest.id,
      title: "Test Movie",
      imdbId: requestedId,
      contentRating: "g",
      genres: [],
      type: "movie",
    },
  });

  expect(result).instanceOf(Movie);
  expect(result).toEqual(
    expect.objectContaining({
      id: 1,
      title: "Test Movie",
      type: "movie",
    }),
  );
});

it("throws an error if the item processing fails", async () => {
  const requestedId = "1234";

  await expect(
    persistMovieIndexerData({
      item: {
        id: 1,
        title: "Test Movie",
        imdbId: requestedId,
        contentRating: "g",
        genres: [],
        type: "movie",
      },
    }),
  ).rejects.toThrow(MediaItemIndexError);
});
