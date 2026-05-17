import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import * as classValidator from "class-validator";
import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("returns the media item if processed successfully", async ({
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
  expect(result).toEqual(
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

it("throws a MediaItemIndexError if the item request is missing tmdbId", async ({
  services: { indexerService },
  factories: { movieItemRequestFactory },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    tmdbId: null,
    state: "requested",
  });

  await expect(
    indexerService.indexItem({
      id: itemRequest.id,
      title: "Test Movie",
      contentRating: "g",
      genres: [],
      type: "movie",
      runtime: 40,
      releaseDate: DateTime.utc().toISO(),
    }),
  ).rejects.toThrow(MediaItemIndexError);
});

it("sets state to unreleased for a movie with a future release date", async ({
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    state: "requested",
  });

  const futureDate = DateTime.utc().plus({ years: 1 });

  const result = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Future Movie",
    contentRating: "g",
    genres: [],
    type: "movie",
    runtime: 120,
    releaseDate: futureDate.toISO(),
  });

  expect(result).toBeInstanceOf(Movie);
  expect(result.year).toBe(futureDate.year);
});

it("throws MediaItemIndexError when validation fails", async ({
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    state: "requested",
  });

  const validationError = new classValidator.ValidationError();
  validationError.constraints = { isNotEmpty: "title should not be empty" };

  vi.spyOn(classValidator, "validateOrReject").mockRejectedValueOnce([
    validationError,
  ]);

  await expect(
    indexerService.indexItem({
      id: itemRequest.id,
      title: "Test Movie",
      contentRating: "g",
      genres: [],
      type: "movie",
      runtime: 40,
      releaseDate: DateTime.utc().toISO(),
    }),
  ).rejects.toThrow(MediaItemIndexError);
});

it("handles null releaseDate correctly", async ({
  factories: { movieItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await movieItemRequestFactory.createOne({
    state: "requested",
  });

  const result = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Unknown Date Movie",
    contentRating: "g",
    genres: [],
    type: "movie",
    runtime: 90,
    releaseDate: null,
  });

  expect(result).toBeInstanceOf(Movie);
  expect(result.year).toBeNull();
  expect(result.releaseDate).toBeNull();
});

it("backfills imdbId from movie to item request when missing", async ({
  factories: { movieItemRequestFactory },
  services: { indexerService },
  em,
}) => {
  const { ItemRequest } = await import("@repo/util-plugin-sdk/dto/entities");

  const itemRequest = await movieItemRequestFactory.createOne({
    imdbId: null,
    state: "requested",
  });

  await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Movie",
    imdbId: "tt9999999",
    contentRating: "g",
    genres: [],
    type: "movie",
    runtime: 40,
    releaseDate: DateTime.utc().toISO(),
  });

  em.clear();
  const updatedRequest = await em.findOneOrFail(ItemRequest, {
    id: itemRequest.id,
  });

  expect(updatedRequest.imdbId).toBe("tt9999999");
});
