import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { faker } from "@faker-js/faker";
import { ref, wrap } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import { expect, vi } from "vitest";

import { rivenTestContext as it } from "../../../../__tests__/test-context.ts";
import { StreamFactory } from "../../../../database/factories/stream.factory.ts";
import { CompletedMovieSeeder } from "../../../../database/seeders/movies/completed-movie.seeder.ts";
import { ScrapedMovieSeeder } from "../../../../database/seeders/movies/scraped-movie.seeder.ts";
import { MatchedFile } from "../steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { persistDownloadResults } from "./persist-download-results.ts";

it("throws an error if the media item has no streams", async ({ movie }) => {
  await expect(
    persistDownloadResults({
      id: movie.id,
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
            matchedMediaItemId: movie.id,
            isCachedFile: false,
          },
        ],
        torrentId: "1",
      },
    }),
  ).rejects.toThrow(
    new UnrecoverableError(
      `No media item found with ID ${movie.id.toString()} and stream info hash 1234567890123456789012345678901234567890`,
    ),
  );
});

it("throws a MediaItemDownloadErrorIncorrectState if the media item is not in the scraped or ongoing state", async ({
  em,
  orm,
}) => {
  await orm.seeder.seed(CompletedMovieSeeder);

  const movie = await em.findOneOrFail(Movie, { type: "movie" });
  const infoHash = faker.git.commitSha();

  movie.streams.add(
    new StreamFactory(em).makeEntity({
      infoHash,
    }),
  );

  await em.flush();

  await expect(
    persistDownloadResults({
      id: movie.id,
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
            matchedMediaItemId: movie.id,
            isCachedFile: false,
          },
        ],
      },
    }),
  ).rejects.toThrow(MediaItemDownloadErrorIncorrectState);
});

it("sets the active stream and updates the state to completed if successful", async ({
  em,
  orm,
}) => {
  await orm.seeder.seed(ScrapedMovieSeeder);

  const movie = await em.findOneOrFail(
    Movie,
    { type: "movie" },
    { populate: ["streams"] },
  );
  const stream = movie.streams[0];

  expect.assert(stream);

  const updatedItem = await persistDownloadResults({
    id: movie.id,
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
          matchedMediaItemId: movie.id,
          isCachedFile: false,
        },
      ],
    },
  });

  expect(updatedItem.activeStream?.id).toBe(stream.id);
  expect(updatedItem.state).toBe("completed");
});

it("adds a single media entry for movies", async ({ movie, em, stream }) => {
  movie.streams.add(stream);

  await em.persist(movie).flush();

  await persistDownloadResults({
    id: movie.id,
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
          matchedMediaItemId: movie.id,
          isCachedFile: false,
        },
      ],
    },
  });

  const mediaEntries = await movie.getMediaEntries();

  expect(mediaEntries).toHaveLength(1);
});

it("adds one media entry per episode for shows", async ({
  show,
  em,
  stream,
}) => {
  show.streams.add(stream);

  await em.persist(show).flush();

  const episodes = await show.getEpisodes();

  await persistDownloadResults({
    id: show.id,
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

  const updatedEpisodes = await show.getEpisodes();

  for (const episode of updatedEpisodes) {
    const mediaEntries = await episode.getMediaEntries();

    expect(mediaEntries).toHaveLength(1);
  }
});

it("does not create duplicate media entries for episodes with existing entries", async ({
  show,
  season,
  em,
  stream,
  mediaEntry,
}) => {
  show.streams.add(stream);

  await wrap(season).populate(["episodes"]);

  const [episode] = season.episodes;

  expect.assert(episode);

  mediaEntry.mediaItem = ref(episode);

  episode.filesystemEntries.add(mediaEntry);

  await em.persist(show).flush();

  await persistDownloadResults({
    id: show.id,
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
  movie,
  em,
  stream,
}) => {
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
            matchedMediaItemId: movie.id,
            isCachedFile: false,
          },
        ],
      },
    }),
  ).rejects.toThrow(MediaItemDownloadError);
});
