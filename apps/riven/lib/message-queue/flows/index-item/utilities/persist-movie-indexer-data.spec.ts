import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { DateTime } from "luxon";
import { expect } from "vitest";

import { rivenTestContext as it } from "../../../../__tests__/test-context.ts";
import { persistMovieIndexerData } from "./persist-movie-indexer-data.ts";

it("returns the media item if processed successfully", async ({
  factories: { itemRequestFactory },
}) => {
  const requestedId = "tt1234567";

  const itemRequest = await itemRequestFactory.createOne({
    imdbId: requestedId,
    tmdbId: "1234",
    state: "requested",
  });

  const result = await persistMovieIndexerData({
    item: {
      id: itemRequest.id,
      title: "Test Movie",
      imdbId: requestedId,
      contentRating: "g",
      genres: [],
      type: "movie",
      runtime: 40,
      releaseDate: DateTime.now().toISO(),
    },
  });

  expect(result).instanceOf(Movie);
  expect(result).toEqual(
    expect.objectContaining({
      id: 1,
      title: "Test Movie",
      type: "movie",
      runtime: 40,
    }),
  );
});

it("throws a MediaItemIndexErrorIncorrectState error if the item request is in an incorrect state", async ({
  factories: { itemRequestFactory },
}) => {
  const requestedId = "1234";

  const itemRequest = await itemRequestFactory.createOne({
    imdbId: requestedId,
    tmdbId: "1234",
    state: "completed",
  });

  await expect(
    persistMovieIndexerData({
      item: {
        id: itemRequest.id,
        title: "Test Movie",
        imdbId: requestedId,
        contentRating: "g",
        genres: [],
        type: "movie",
        runtime: 40,
        releaseDate: DateTime.now().toISO(),
      },
    }),
  ).rejects.toThrow(MediaItemIndexErrorIncorrectState);
});
