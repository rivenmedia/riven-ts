import {
  ShowLikeMediaItem,
  FileSystemEntry,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";

import { NotFoundError } from "@mikro-orm/core";
import { describe, expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

describe(`when the media item is a movie`, () => {
  it("removes the movie", async ({
    services,
    completedMovieContext: { completedMovie },
  }) => {
    await services.mediaItemService.removeMediaItem(completedMovie);

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

    await services.mediaItemService.removeMediaItem(completedMovie);

    await expect(
      em.find(Stream, {
        parents: { id: completedMovie.id },
      }),
    ).resolves.toHaveLength(0);
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

    await services.mediaItemService.removeMediaItem(completedMovie);

    await expect(
      em.find(FileSystemEntry, {
        mediaItem: { tmdbId: completedMovie.tmdbId },
      }),
    ).resolves.toHaveLength(0);
  });
});

describe(`when the media item is a show`, () => {
  it("removes the show and all seasons/episodes", async ({
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

  it("removes all filesystem entries for the show and its children", async ({
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

  it("removes all streams for the show", async ({
    em,
    services,
    completedShowContext: { completedShow },
  }) => {
    await expect(
      em.find(Stream, {
        parents: completedShow,
      }),
    ).resolves.toHaveLength(10);

    await services.mediaItemService.removeMediaItem(completedShow);

    await expect(
      em.find(Stream, {
        parents: { id: completedShow.id },
      }),
    ).resolves.toHaveLength(0);
  });

  it("removes all streams for the show's seasons", async ({
    em,
    services,
    completedShowContext: { completedShow, seasons },
    factories: { streamFactory },
  }) => {
    for (const season of seasons) {
      season.streams.add(streamFactory.make(10));

      em.persist(season);
    }

    await em.flush();

    for (const season of seasons) {
      await expect(
        em.find(Stream, {
          parents: season,
        }),
      ).resolves.toHaveLength(10);
    }

    await services.mediaItemService.removeMediaItem(completedShow);

    for (const season of seasons) {
      await expect(
        em.find(Stream, {
          parents: { id: season.id },
        }),
      ).resolves.toHaveLength(0);
    }
  });

  it("removes all streams for the show's episodes", async ({
    em,
    services,
    completedShowContext: { completedShow, episodes },
    factories: { streamFactory },
  }) => {
    for (const season of episodes) {
      season.streams.add(streamFactory.make(10));

      em.persist(season);
    }

    await em.flush();

    for (const season of episodes) {
      await expect(
        em.find(Stream, {
          parents: season,
        }),
      ).resolves.toHaveLength(10);
    }

    await services.mediaItemService.removeMediaItem(completedShow);

    for (const season of episodes) {
      await expect(
        em.find(Stream, {
          parents: { id: season.id },
        }),
      ).resolves.toHaveLength(0);
    }
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
