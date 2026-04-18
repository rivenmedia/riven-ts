import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { NotFoundError, ref } from "@mikro-orm/core";
import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { MatchedFile } from "../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";

it("throws an error if the media item has no streams", async ({
  indexedMovieContext: { indexedMovie },
  services,
}) => {
  await expect(
    services.downloaderService.downloadItem(
      indexedMovie.id,
      {
        infoHash: "1234567890123456789012345678901234567890",
        provider: null,
        files: [
          {
            size: 1024,
            link: "http://example.com/file.mp4",
            name: "file.mp4",
            path: "/file.mp4",
            matchedMediaItemId: indexedMovie.id,
            isCachedFile: false,
          },
        ],
        torrentId: "1",
      },
      "@repo/plugin-test",
    ),
  ).rejects.toThrow(
    new NotFoundError(
      `No media item found with ID ${indexedMovie.id} and stream info hash 1234567890123456789012345678901234567890`,
    ),
  );
});

it("throws a MediaItemDownloadErrorIncorrectState if the media item is not in the scraped or ongoing state", async ({
  completedMovieContext: { completedMovie },
  factories: { streamFactory },
  em,
  services,
}) => {
  const stream = streamFactory.makeEntity();

  em.persist(completedMovie);

  completedMovie.streams.add(stream);

  await em.flush();

  await expect(
    services.downloaderService.downloadItem(
      completedMovie.id,
      {
        torrentId: "1",
        infoHash: stream.infoHash,
        provider: null,
        files: [
          {
            size: 1024,
            link: "http://example.com/file.mp4",
            name: "file.mp4",
            path: "/file.mp4",
            matchedMediaItemId: completedMovie.id,
            isCachedFile: false,
          },
        ],
      },
      "@repo/plugin-test",
    ),
  ).rejects.toThrow(MediaItemDownloadErrorIncorrectState);
});

it("sets the active stream and updates the state to completed if successful", async ({
  scrapedMovieContext: { scrapedMovie },
  services,
}) => {
  const [stream] = await scrapedMovie.streams.load();

  expect.assert(stream);

  const updatedItem = await services.downloaderService.downloadItem(
    scrapedMovie.id,
    {
      torrentId: "1",
      infoHash: stream.infoHash,
      provider: null,
      files: [
        {
          size: 1024,
          link: "http://example.com/file.mp4",
          name: "file.mp4",
          path: "/file.mp4",
          matchedMediaItemId: scrapedMovie.id,
          isCachedFile: false,
        },
      ],
    },
    "@repo/plugin-test",
  );

  expect(updatedItem.activeStream?.id).toBe(stream.id);
  expect(updatedItem.state).toBe("completed");
});

it("adds a single media entry for movies", async ({
  scrapedMovieContext: { scrapedMovie },
  services,
}) => {
  const [stream] = await scrapedMovie.streams.load();

  expect.assert(stream);

  await services.downloaderService.downloadItem(
    scrapedMovie.id,
    {
      torrentId: "1",
      infoHash: stream.infoHash,
      provider: null,
      files: [
        {
          size: 1024,
          link: "http://example.com/file.mp4",
          name: "file.mp4",
          path: "/file.mp4",
          matchedMediaItemId: scrapedMovie.id,
          isCachedFile: false,
        },
      ],
    },
    "@repo/plugin-test",
  );

  const mediaEntries = await scrapedMovie.getMediaEntries();

  expect(mediaEntries).toHaveLength(1);
});

it("adds one media entry per episode for shows", async ({
  scrapedShowContext: {
    scrapedShow,
    streams: [stream],
  },
  services,
}) => {
  const episodes = await scrapedShow.getEpisodes();

  expect.assert(stream);

  await services.downloaderService.downloadItem(
    scrapedShow.id,
    {
      torrentId: "1",
      infoHash: stream.infoHash,
      provider: null,
      files: episodes.map<MatchedFile>((episode) => ({
        size: 1024,
        link: `http://example.com/${episode.title}.mp4`,
        path: `/${episode.title}.mp4`,
        name: `${episode.title}.mp4`,
        matchedMediaItemId: episode.id,
        isCachedFile: false,
      })) as [MatchedFile, ...MatchedFile[]],
    },
    "@repo/plugin-test",
  );

  const updatedEpisodes = await scrapedShow.getEpisodes();

  for (const episode of updatedEpisodes) {
    const mediaEntries = await episode.getMediaEntries();

    expect(mediaEntries).toHaveLength(1);
  }
});

it("does not create duplicate media entries for episodes with existing entries", async ({
  scrapedShowContext: {
    scrapedShow,
    streams: [stream],
    episodes: [episode],
  },
  em,
  factories: { mediaEntryFactory },
  services,
}) => {
  expect.assert(stream);
  expect.assert(episode);

  em.persist(episode);
  em.persist(scrapedShow);

  episode.filesystemEntries.add(
    mediaEntryFactory.makeOne({
      mediaItem: ref(episode),
    }),
  );

  await em.flush();

  await services.downloaderService.downloadItem(
    scrapedShow.id,
    {
      torrentId: "1",
      infoHash: stream.infoHash,
      provider: null,
      files: [
        {
          size: 1024,
          link: "http://example.com/file.mp4",
          name: "file.mp4",
          path: "/file.mp4",
          matchedMediaItemId: episode.id,
          isCachedFile: false,
        },
      ],
    },
    "@repo/plugin-test",
  );

  const mediaEntries = await episode.getMediaEntries();

  expect(mediaEntries).toHaveLength(1);
});

it("throws a MediaItemDownloadError if a validation error occurs during persistence", async ({
  scrapedMovieContext: {
    scrapedMovie,
    streams: [stream],
  },
  services,
}) => {
  expect.assert(stream);

  vi.spyOn(
    await import("class-validator"),
    "validateOrReject",
  ).mockRejectedValue(new Error("Validation error"));

  await expect(
    services.downloaderService.downloadItem(
      scrapedMovie.id,
      {
        torrentId: "1",
        infoHash: stream.infoHash,
        provider: null,
        files: [
          {
            size: 1024,
            link: "http://example.com/file.mp4",
            name: "file.mp4",
            path: "/file.mp4",
            matchedMediaItemId: scrapedMovie.id,
            isCachedFile: false,
          },
        ],
      },
      "@repo/plugin-test",
    ),
  ).rejects.toThrow(MediaItemDownloadError);
});
