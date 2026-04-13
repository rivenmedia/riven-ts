import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { DateTime } from "luxon";
import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { indexMovieMutation } from "./index-movie.mutation.ts";

it("returns the media item if processed successfully", async ({
  em,
  factories: { movieItemRequestFactory },
}) => {
  const requestedId = "tt1234567";

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const result = await indexMovieMutation(em, {
    id: itemRequest.id,
    title: "Test Movie",
    imdbId: requestedId,
    contentRating: "g",
    genres: [],
    runtime: 40,
    releaseDate: DateTime.now().toISO(),
  });

  expect(result).instanceOf(Movie);
  expect(result).toEqual(
    expect.objectContaining({
      title: "Test Movie",
      type: "movie",
      runtime: 40,
    }),
  );
});

it("throws a MediaItemIndexErrorIncorrectState error if the item request is in an incorrect state", async ({
  em,
  factories: { movieItemRequestFactory },
}) => {
  const requestedId = "1234";

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "completed",
  });

  await expect(
    indexMovieMutation(em, {
      id: itemRequest.id,
      title: "Test Movie",
      imdbId: requestedId,
      contentRating: "g",
      genres: [],
      runtime: 40,
      releaseDate: DateTime.now().toISO(),
    }),
  ).rejects.toThrow(MediaItemIndexErrorIncorrectState);
});
