import {
  ShowLikeMediaItem,
  FileSystemEntry,
} from "@repo/util-plugin-sdk/dto/entities";

import { NotFoundError } from "@mikro-orm/core";
import { describe, expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

describe(`when the media item is a movie`, () => {
  it("removes the media item", async ({
    services,
    completedMovieContext: { completedMovie },
  }) => {
    await services.mediaItemService.removeMediaItem(completedMovie);

    await expect(
      services.mediaItemService.getMediaItemById(completedMovie.id),
    ).rejects.toThrow(NotFoundError);
  });

  it("removes all filesystem entries for the media item", async ({
    em,
    services,
    completedMovieContext: { completedMovie },
  }) => {
    await expect(
      em.find(FileSystemEntry, {
        mediaItem: { tmdbId: completedMovie.tmdbId },
      }),
    ).resolves.toHaveLength(1);

    await services.mediaItemService.removeMediaItem(completedMovie);

    await expect(
      em.find(FileSystemEntry, {
        mediaItem: { tmdbId: completedMovie.tmdbId },
      }),
    ).resolves.toHaveLength(0);
  });
});

describe(`when the media item is a show`, () => {
  it("removes all child items for the media item", async ({
    em,
    services,
    completedShowContext: { completedShow },
  }) => {
    await expect(
      em.find(ShowLikeMediaItem, {
        tvdbId: completedShow.tvdbId,
      }),
    ).resolves.toHaveLength(67);

    await services.mediaItemService.removeMediaItem(completedShow);

    await expect(
      em.find(ShowLikeMediaItem, {
        tvdbId: completedShow.tvdbId,
      }),
    ).resolves.toHaveLength(0);
  });

  it("removes all filesystem entries for the media item & children", async ({
    em,
    services,
    completedShowContext: { completedShow },
  }) => {
    await expect(
      em.find(FileSystemEntry, {
        mediaItem: { tvdbId: completedShow.tvdbId },
      }),
    ).resolves.toHaveLength(60);

    await services.mediaItemService.removeMediaItem(completedShow);

    await expect(
      em.find(FileSystemEntry, {
        mediaItem: { tvdbId: completedShow.tvdbId },
      }),
    ).resolves.toHaveLength(0);
  });
});

describe(`when the media item is a season`, () => {
  it("throws an error", async ({
    services,
    completedShowContext: {
      seasons: [seasonToRemove],
    },
  }) => {
    expect.assert(seasonToRemove);

    await expect(
      services.mediaItemService.removeMediaItem(seasonToRemove),
    ).rejects.toThrow(
      "Only top-level media items (Movie, Show) can be removed",
    );
  });
});

describe(`when the media item is an episode`, () => {
  it("throws an error", async ({
    services,
    completedShowContext: {
      episodes: [episodeToRemove],
    },
  }) => {
    expect.assert(episodeToRemove);

    await expect(
      services.mediaItemService.removeMediaItem(episodeToRemove),
    ).rejects.toThrow(
      "Only top-level media items (Movie, Show) can be removed",
    );
  });
});

it.todo("removes all jobs associated with a media item");
