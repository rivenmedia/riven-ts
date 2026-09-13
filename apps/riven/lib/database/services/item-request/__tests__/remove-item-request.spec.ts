import {
  ShowLikeMediaItem,
  FileSystemEntry,
  Stream,
  BlacklistedStream,
} from "@repo/util-plugin-sdk/dto/entities";

import { NotFoundError, ref } from "@mikro-orm/core";
import { describe, expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

describe(`when the media item is a movie`, () => {
  it("removes the item request", async ({
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
});

describe(`when the media item is a show`, () => {
  it("removes the item request", async ({
    services,
    completedShowContext: { completedShow },
  }) => {
    await services.itemRequestService.removeItemRequest(
      completedShow.itemRequest,
    );

    await expect(
      services.itemRequestService.getItemRequestById(
        completedShow.itemRequest.id,
      ),
    ).rejects.toThrow(NotFoundError);
  });

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

    await services.itemRequestService.removeItemRequest(
      completedShow.itemRequest,
    );

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

    await services.itemRequestService.removeItemRequest(
      completedShow.itemRequest,
    );

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

    await services.itemRequestService.removeItemRequest(
      completedShow.itemRequest,
    );

    await expect(
      em.find(Stream, {
        parents: { id: completedShow.id },
      }),
    ).resolves.toHaveLength(0);
  });

  it("removes all blacklisted streams for the show", async ({
    em,
    services,
    completedShowContext: {
      completedShow,
      streams: [activeStream],
    },
  }) => {
    expect.assert(activeStream);

    const activeStreamRef = ref(activeStream);

    completedShow.activeStream = activeStreamRef;

    for (const season of completedShow.seasons) {
      season.activeStream = activeStreamRef;

      for (const episode of season.episodes) {
        episode.activeStream = activeStreamRef;
      }
    }

    await em.flush();

    const [mediaEntry] = await completedShow.getMediaEntries();

    expect.assert(mediaEntry);

    const { blacklistedItems } =
      await services.streamService.blacklistActiveStream({
        mediaItem: completedShow,
        plugin: mediaEntry.plugin,
        provider: mediaEntry.provider,
      });

    await expect(
      em.count(BlacklistedStream, {
        mediaItem: {
          $in: blacklistedItems,
        },
      }),
    ).resolves.toBe(67);

    await services.itemRequestService.removeItemRequest(
      completedShow.itemRequest,
    );

    await expect(
      em.count(BlacklistedStream, {
        mediaItem: {
          $in: blacklistedItems,
        },
      }),
    ).resolves.toBe(0);
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

    await services.itemRequestService.removeItemRequest(
      completedShow.itemRequest,
    );

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
    for (const episode of episodes) {
      episode.streams.add(streamFactory.make(10));

      em.persist(episode);
    }

    await em.flush();

    for (const episode of episodes) {
      await expect(
        em.find(Stream, {
          parents: episode,
        }),
      ).resolves.toHaveLength(10);
    }

    await services.itemRequestService.removeItemRequest(
      completedShow.itemRequest,
    );

    for (const episode of episodes) {
      await expect(
        em.find(Stream, {
          parents: { id: episode.id },
        }),
      ).resolves.toHaveLength(0);
    }
  });
});
