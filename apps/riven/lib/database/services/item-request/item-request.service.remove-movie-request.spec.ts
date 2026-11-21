import {
  FileSystemEntry,
  Stream,
  BlacklistedStream,
} from "@repo/util-plugin-sdk/dto/entities";

import { NotFoundError } from "@mikro-orm/core";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

it("removes the item request for a movie", async ({
  services,
  completedMovieContext: { completedMovie },
}) => {
  await services.itemRequestService.removeItemRequest(
    completedMovie.itemRequest,
  );

  await expect(
    services.itemRequestService.getItemRequestById(
      completedMovie.itemRequest.id,
    ),
  ).rejects.toThrow(NotFoundError);
});

it("removes the movie", async ({
  services,
  completedMovieContext: { completedMovie },
}) => {
  await services.itemRequestService.removeItemRequest(
    completedMovie.itemRequest,
  );

  await expect(
    services.mediaItemService.getMediaItemById(completedMovie.id),
  ).rejects.toThrow(NotFoundError);
});

it("removes all streams for the movie", async ({
  em,
  services,
  completedMovieContext: { completedMovie },
}) => {
  await expect(
    em.find(Stream, {
      parents: { id: completedMovie.id },
    }),
  ).resolves.toHaveLength(10);

  await services.itemRequestService.removeItemRequest(
    completedMovie.itemRequest,
  );

  await expect(
    em.find(Stream, {
      parents: { id: completedMovie.id },
    }),
  ).resolves.toHaveLength(0);
});

it("removes all blacklisted streams for the movie", async ({
  em,
  services,
  completedMovieContext: { completedMovie },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  const { blacklistedItems } =
    await services.streamService.blacklistActiveStream({
      mediaItem: completedMovie,
      plugin: mediaEntry.plugin,
      provider: mediaEntry.provider,
    });

  await expect(
    em.count(BlacklistedStream, { mediaItem: { $in: blacklistedItems } }),
  ).resolves.toBe(1);

  await services.itemRequestService.removeItemRequest(
    completedMovie.itemRequest,
  );

  await expect(
    em.count(BlacklistedStream, { mediaItem: { $in: blacklistedItems } }),
  ).resolves.toBe(0);
});

it("removes all filesystem entries for the movie", async ({
  em,
  services,
  completedMovieContext: { completedMovie },
}) => {
  await expect(
    em.find(FileSystemEntry, {
      mediaItem: { tmdbId: completedMovie.tmdbId },
    }),
  ).resolves.toHaveLength(1);

  await services.itemRequestService.removeItemRequest(
    completedMovie.itemRequest,
  );

  await expect(
    em.find(FileSystemEntry, {
      mediaItem: { tmdbId: completedMovie.tmdbId },
    }),
  ).resolves.toHaveLength(0);
});
