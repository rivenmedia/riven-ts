import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { ref } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import { expect, vi } from "vitest";

import { rivenTestContext as it } from "../../../../__tests__/test-context.ts";
import { persistDownloadResults } from "./persist-download-results.ts";

import type { MatchedFile } from "../steps/find-valid-torrent-container/find-valid-torrent-container.schema.ts";

it("throws an error if the media item has no streams", async ({ movie }) => {
  await expect(
    persistDownloadResults({
      id: movie.id,
      processedBy: "@repo/plugin-test",
      container: {
        infoHash: "1234567890123456789012345678901234567890",
        files: [
          {
            fileSize: 1024,
            downloadUrl: "http://example.com/file.mp4",
            fileName: "file.mp4",
            matchedMediaItemId: movie.id,
          },
        ],
        torrentId: 1,
        torrentInfo: {
          files: {},
          infoHash: "",
          name: "",
          id: "",
          isCached: true,
          links: [],
          sizeMB: 0,
          alternativeFilename: "",
        },
      },
    }),
  ).rejects.toThrow(UnrecoverableError);
});

it("throws a MediaItemDownloadErrorIncorrectState if the media item is not in the scraped or ongoing state", async ({
  movie,
  stream,
  database,
}) => {
  const em = database.em.fork();

  movie.streams.add(stream);
  movie.filesystemEntries.add(
    em.create(MediaEntry, {
      fileSize: 1024,
      downloadUrl: "http://example.com/file.mp4",
      originalFilename: "file.mp4",
      provider: "@repo/plugin-test",
      mediaItem: movie,
    }),
  );

  await em.persist(movie).flush();

  await expect(
    persistDownloadResults({
      id: movie.id,
      processedBy: "@repo/plugin-test",
      container: {
        infoHash: stream.infoHash,
        files: [
          {
            fileSize: 1024,
            downloadUrl: "http://example.com/file.mp4",
            fileName: "file.mp4",
            matchedMediaItemId: movie.id,
          },
        ],
        torrentId: 1,
        torrentInfo: {
          files: {},
          infoHash: stream.infoHash,
          name: "",
          id: "",
          isCached: true,
          links: [],
          sizeMB: 0,
          alternativeFilename: "",
        },
      },
    }),
  ).rejects.toThrow(MediaItemDownloadErrorIncorrectState);
});

it("sets the active stream and updates the state to downloaded if successful", async ({
  movie,
  stream,
  database,
}) => {
  movie.streams.add(stream);

  await database.em.fork().persist(movie).flush();

  const updatedItem = await persistDownloadResults({
    id: movie.id,
    processedBy: "@repo/plugin-test",
    container: {
      infoHash: stream.infoHash,
      files: [
        {
          fileSize: 1024,
          downloadUrl: "http://example.com/file.mp4",
          fileName: "file.mp4",
          matchedMediaItemId: movie.id,
        },
      ],
      torrentId: 1,
      torrentInfo: {
        files: {},
        infoHash: stream.infoHash,
        name: "",
        id: "",
        isCached: true,
        links: [],
        sizeMB: 0,
        alternativeFilename: "",
      },
    },
  });

  expect(updatedItem.activeStream?.id).toBe(stream.id);
  expect(updatedItem.state).toBe("downloaded");
});

it("adds a single media entry for movies", async ({
  movie,
  database,
  stream,
}) => {
  movie.streams.add(stream);

  await database.em.fork().persist(movie).flush();

  await persistDownloadResults({
    id: movie.id,
    processedBy: "@repo/plugin-test",
    container: {
      infoHash: stream.infoHash,
      files: [
        {
          fileSize: 1024,
          downloadUrl: "http://example.com/file.mp4",
          fileName: "file.mp4",
          matchedMediaItemId: movie.id,
        },
      ],
      torrentId: 1,
      torrentInfo: {
        files: {},
        infoHash: stream.infoHash,
        name: "",
        id: "",
        isCached: true,
        links: [],
        sizeMB: 0,
        alternativeFilename: "",
      },
    },
  });

  const mediaEntries = await movie.getMediaEntries();

  expect(mediaEntries).toHaveLength(1);
});

it("adds one media entry per episode for shows", async ({
  show,
  database,
  stream,
}) => {
  show.streams.add(stream);

  await database.em.fork().persist(show).flush();

  const episodes = await show.getEpisodes();

  await persistDownloadResults({
    id: show.id,
    processedBy: "@repo/plugin-test",
    container: {
      infoHash: stream.infoHash,
      files: episodes.map((episode) => ({
        fileSize: 1024,
        downloadUrl: `http://example.com/${episode.title}.mp4`,
        fileName: `${episode.title}.mp4`,
        matchedMediaItemId: episode.id,
      })) as [MatchedFile, ...MatchedFile[]],
      torrentId: 1,
      torrentInfo: {
        files: {},
        infoHash: stream.infoHash,
        name: "",
        id: "",
        isCached: true,
        links: [],
        sizeMB: 0,
        alternativeFilename: "",
      },
    },
  });

  const updatedEpisodes = await show.getEpisodes();

  for (const episode of updatedEpisodes) {
    const mediaEntries = await episode.getMediaEntries();

    expect(mediaEntries).toHaveLength(1);
  }
});

it("does not create duplicate media entries for episodes with existing entries", async ({
  show,
  season,
  database,
  stream,
  mediaEntry,
}) => {
  show.streams.add(stream);

  const [episode] = season.episodes;

  expect.assert(episode);

  mediaEntry.mediaItem = ref(episode);

  episode.filesystemEntries.add(mediaEntry);

  await database.em.fork().persist(show).flush();

  await persistDownloadResults({
    id: show.id,
    processedBy: "@repo/plugin-test",
    container: {
      infoHash: stream.infoHash,
      files: [
        {
          fileSize: 1024,
          downloadUrl: "http://example.com/file.mp4",
          fileName: "file.mp4",
          matchedMediaItemId: episode.id,
        },
      ],
      torrentId: 1,
      torrentInfo: {
        files: {},
        infoHash: stream.infoHash,
        name: "",
        id: "",
        isCached: true,
        links: [],
        sizeMB: 0,
        alternativeFilename: "",
      },
    },
  });

  const mediaEntries = await episode.getMediaEntries();

  expect(mediaEntries).toHaveLength(1);
});

it("throws a MediaItemDownloadError if a validation error occurs during persistence", async ({
  movie,
  database,
  stream,
}) => {
  const em = database.em.fork();

  movie.streams.add(stream);

  await em.persist(movie).flush();

  vi.spyOn(
    await import("class-validator"),
    "validateOrReject",
  ).mockRejectedValue(new Error("Validation error"));

  await expect(
    persistDownloadResults({
      id: movie.id,
      processedBy: "@repo/plugin-test",
      container: {
        infoHash: stream.infoHash,
        files: [
          {
            fileSize: 1024,
            downloadUrl: "http://example.com/file.mp4",
            fileName: "file.mp4",
            matchedMediaItemId: movie.id,
          },
        ],
        torrentId: 1,
        torrentInfo: {
          files: {},
          infoHash: stream.infoHash,
          name: "",
          id: "",
          isCached: true,
          links: [],
          sizeMB: 0,
          alternativeFilename: "",
        },
      },
    }),
  ).rejects.toThrow(MediaItemDownloadError);
});
