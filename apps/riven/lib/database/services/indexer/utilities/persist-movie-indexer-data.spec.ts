import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { wrap } from "@mikro-orm/core";
import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("returns the movie if processed successfully", async ({
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const requestedId = "tt1234567";

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const result = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Movie",
    imdbId: requestedId,
    contentRating: "g",
    genres: [],
    type: "movie",
    runtime: 40,
    releaseDate: DateTime.utc().toISO(),
  });

  expect(result).instanceOf(Movie);
  expect(result).toStrictEqual(
    expect.objectContaining({
      title: "Test Movie",
      type: "movie",
      runtime: 40,
    }),
  );
});

it("throws a MediaItemIndexErrorIncorrectState error if the item request is in an incorrect state", async ({
  services: { indexerService },
  factories: { movieItemRequestFactory },
}) => {
  const requestedId = "1234";

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "completed",
  });

  await expect(
    indexerService.indexItem({
      id: itemRequest.id,
      title: "Test Movie",
      imdbId: requestedId,
      contentRating: "g",
      genres: [],
      type: "movie",
      runtime: 40,
      releaseDate: DateTime.utc().toISO(),
    }),
  ).rejects.toThrow(MediaItemIndexErrorIncorrectState);
});

it("updates the movie with the latest data if it already exists", async ({
  services: { indexerService },
  factories: { movieItemRequestFactory },
}) => {
  vi.useFakeTimers({
    now: DateTime.utc().toJSDate(),
  });

  const requestedId = "tt1234567";

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const releaseDate = DateTime.utc().plus({ months: 1 });

  const initialMovie = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Movie",
    imdbId: requestedId,
    contentRating: "g",
    genres: [],
    type: "movie",
    runtime: 40,
    releaseDate: releaseDate.toISO(),
  });

  expect(wrap(initialMovie).toJSON()).toStrictEqual(
    expect.objectContaining({
      genres: [],
      state: "unreleased",
      releaseDate: releaseDate.toJSDate(),
    }),
  );

  vi.setSystemTime(DateTime.utc().plus({ months: 2 }).toJSDate());

  const updatedReleasedMovie = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Movie",
    imdbId: requestedId,
    contentRating: "g",
    genres: [],
    type: "movie",
    runtime: 40,
    releaseDate: releaseDate.toISO(),
  });

  expect(wrap(updatedReleasedMovie).toJSON()).toStrictEqual(
    expect.objectContaining({
      state: "indexed",
      releaseDate: releaseDate.toJSDate(),
      createdAt: initialMovie.createdAt,
      scrapedAt: initialMovie.scrapedAt,
    }),
  );
});
