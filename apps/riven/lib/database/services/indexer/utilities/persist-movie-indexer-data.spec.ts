import { ItemRequest, Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { wrap } from "@mikro-orm/core";
import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type { MovieIndexData } from "./persist-movie-indexer-data.ts";

const it = baseIt.extend(
  "indexedMovie",
  () =>
    (
      id: ItemRequest["id"],
      overrides: Partial<Pick<MovieIndexData, "imdbId" | "releaseDate">> = {},
    ): MovieIndexData => ({
      id,
      title: "Test Movie",
      contentRating: "g",
      genres: [],
      type: "movie",
      runtime: 40,
      imdbId: null,
      releaseDate: null,
      ...overrides,
    }),
);

it("returns the movie if processed successfully", async ({
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const requestedId = "tt1234567";

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const { item: result } = await indexerService.indexItem({
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

it("sets the item request's state to 'completed' if processed successfully", async ({
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const requestedId = "tt1234567";

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const { item: result } = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Movie",
    imdbId: requestedId,
    contentRating: "g",
    genres: [],
    type: "movie",
    runtime: 40,
    releaseDate: DateTime.utc().toISO(),
  });

  await expect(result.itemRequest.loadProperty("state")).resolves.toBe(
    "completed",
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

  const { item: initialMovie } = await indexerService.indexItem({
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

  const { item: updatedReleasedMovie } = await indexerService.indexItem({
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

it("rejects a movie request without a TMDB ID", async ({
  indexedMovie,
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: "tt1234567",
    tmdbId: null,
    state: "requested",
  });

  await expect(
    indexerService.indexItem(indexedMovie(itemRequest.id)),
  ).rejects.toThrow(
    "Item request is missing tmdbId, cannot persist movie indexer data",
  );
});

it("marks a movie without a release date as unreleased", async ({
  indexedMovie,
  em,
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    state: "requested",
  });

  const { item } = await indexerService.indexItem(indexedMovie(itemRequest.id));

  expect(item).toMatchObject({
    releaseDate: null,
    year: null,
    isReleased: false,
  });

  await expect(
    em.fork().findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({ state: "unreleased" });
});

it("fills in the item request's missing IMDB ID from the indexed movie", async ({
  indexedMovie,
  em,
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: null,
    state: "requested",
  });

  const { item } = await indexerService.indexItem(
    indexedMovie(itemRequest.id, {
      imdbId: "tt7654321",
      releaseDate: DateTime.utc(2020, 1, 1).toISO(),
    }),
  );

  expect(item).toMatchObject({ imdbId: "tt7654321", year: 2020 });

  await expect(
    em.fork().findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({
    imdbId: "tt7654321",
    tmdbId: itemRequest.tmdbId,
    state: "completed",
  });
});

it("uses the item request's IMDB ID when the indexer does not provide one", async ({
  indexedMovie,
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: "tt1234567",
    state: "requested",
  });

  const { item } = await indexerService.indexItem(indexedMovie(itemRequest.id));

  expect(item.imdbId).toBe("tt1234567");
});

it("rejects indexed movie data that fails validation", async ({
  indexedMovie,
  em,
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: null,
    state: "requested",
  });

  await expect(
    indexerService.indexItem(
      indexedMovie(itemRequest.id, { imdbId: "not-an-imdb-id" }),
    ),
  ).rejects.toThrow(MediaItemIndexError);

  await expect(
    em.fork().count(Movie, { tmdbId: itemRequest.tmdbId ?? "" }),
  ).resolves.toBe(0);
});
