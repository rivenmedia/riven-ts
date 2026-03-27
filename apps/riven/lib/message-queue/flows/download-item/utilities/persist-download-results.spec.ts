import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { faker } from "@faker-js/faker";
import { ref, wrap } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import { expect, vi } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { MatchedFile } from "../steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { persistDownloadResults } from "./persist-download-results.ts";

it("throws an error if the media item has no streams", async ({
  indexedMovie,
}) => {
  await expect(
    persistDownloadResults({
      id: indexedMovie.id,
      processedBy: "@repo/plugin-test",
      torrent: {
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
    }),
  ).rejects.toThrow(
    new UnrecoverableError(
      `No media item found with ID ${indexedMovie.id.toString()} and stream info hash 1234567890123456789012345678901234567890`,
    ),
  );
});

it("throws a MediaItemDownloadErrorIncorrectState if the media item is not in the scraped or ongoing state", async ({
  completedMovie,
  factories: { streamFactory },
  em,
}) => {
  const infoHash = faker.git.commitSha();

  em.persist(completedMovie);

  completedMovie.streams.add(
    streamFactory.makeEntity({
      infoHash,
    }),
  );

  await em.flush();

  await expect(
    persistDownloadResults({
      id: completedMovie.id,
      processedBy: "@repo/plugin-test",
      torrent: {
        torrentId: "1",
        infoHash,
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
    }),
  ).rejects.toThrow(MediaItemDownloadErrorIncorrectState);
});

it("sets the active stream and updates the state to completed if successful", async ({
  scrapedMovie,
}) => {
  const [stream] = await scrapedMovie.streams.load();

  expect.assert(stream);

  const updatedItem = await persistDownloadResults({
    id: scrapedMovie.id,
    processedBy: "@repo/plugin-test",
    torrent: {
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
  });

  expect(updatedItem.activeStream?.id).toBe(stream.id);
  expect(updatedItem.state).toBe("completed");
});

it("adds a single media entry for movies", async ({ scrapedMovie }) => {
  const [stream] = await scrapedMovie.streams.load();

  expect.assert(stream);

  await persistDownloadResults({
    id: scrapedMovie.id,
    processedBy: "@repo/plugin-test",
    torrent: {
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
  });

  const mediaEntries = await scrapedMovie.getMediaEntries();

  expect(mediaEntries).toHaveLength(1);
});

it("adds one media entry per episode for shows", async ({ scrapedShow }) => {
  const episodes = await scrapedShow.getEpisodes();
  const [stream] = await scrapedShow.streams.loadItems();

  expect.assert(stream);

  await persistDownloadResults({
    id: scrapedShow.id,
    processedBy: "@repo/plugin-test",
    torrent: {
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
  });

  const updatedEpisodes = await scrapedShow.getEpisodes();

  for (const episode of updatedEpisodes) {
    const mediaEntries = await episode.getMediaEntries();

    expect(mediaEntries).toHaveLength(1);
  }
});

it("does not create duplicate media entries for episodes with existing entries", async ({
  scrapedShow,
  season,
  em,
  mediaEntry,
}) => {
  await wrap(season).populate(["episodes"]);

  const [episode] = season.episodes;
  const [stream] = await scrapedShow.streams.loadItems();

  expect.assert(stream);
  expect.assert(episode);

  mediaEntry.mediaItem = ref(episode);

  episode.filesystemEntries.add(mediaEntry);

  await em.persist(scrapedShow).flush();

  await persistDownloadResults({
    id: scrapedShow.id,
    processedBy: "@repo/plugin-test",
    torrent: {
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
  });

  const mediaEntries = await episode.getMediaEntries();

  expect(mediaEntries).toHaveLength(1);
});

it("throws a MediaItemDownloadError if a validation error occurs during persistence", async ({
  scrapedMovie,
}) => {
  const [stream] = await scrapedMovie.streams.load();

  expect.assert(stream);

  vi.spyOn(
    await import("class-validator"),
    "validateOrReject",
  ).mockRejectedValue(new Error("Validation error"));

  await expect(
    persistDownloadResults({
      id: scrapedMovie.id,
      processedBy: "@repo/plugin-test",
      torrent: {
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
    }),
  ).rejects.toThrow(MediaItemDownloadError);
});
